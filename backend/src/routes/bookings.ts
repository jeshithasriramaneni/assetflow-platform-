import { Router, Response } from 'express';
import { z } from 'zod';
import { BookingStatus, AuditAction, NotificationType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';
import { createNotification } from '../utils/notifications';

export const bookingsRouter = Router();

// GET all bookings
bookingsRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, assetId, userId: queryUserId, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Record<string, unknown> = {};
    // Non-admins can only see their own bookings
    if (req.user!.role !== 'ADMIN') {
      where.userId = req.user!.id;
    } else if (queryUserId) {
      where.userId = queryUserId;
    }
    if (status) where.status = status;
    if (assetId) where.assetId = assetId;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, department: true } },
          asset: { include: { category: true } },
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    return res.json({ bookings, total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET single booking
bookingsRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
        asset: { include: { category: true } },
      },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (req.user!.role !== 'ADMIN' && booking.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    return res.json(booking);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// POST create booking
bookingsRouter.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      assetId: z.string().uuid(),
      quantity: z.number().int().positive().default(1),
      purpose: z.string().min(5).max(500),
      startDate: z.string(),
      endDate: z.string(),
    });
    const data = schema.parse(req.body);

    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    if (asset.availableQuantity < data.quantity) {
      return res.status(400).json({ error: `Only ${asset.availableQuantity} units available` });
    }
    if (asset.status === 'UNAVAILABLE' || asset.status === 'MAINTENANCE') {
      return res.status(400).json({ error: 'Asset is not available for booking' });
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (endDate <= startDate) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }
    if (startDate < new Date()) {
      return res.status(400).json({ error: 'Start date cannot be in the past' });
    }

    // Reduce available quantity immediately when booking is created
    const newAvailable = asset.availableQuantity - data.quantity;
    const newStatus = newAvailable <= 0 ? 'UNAVAILABLE' : newAvailable < asset.totalQuantity ? 'PARTIALLY_AVAILABLE' : 'AVAILABLE';

    const booking = await prisma.booking.create({
      data: {
        userId: req.user!.id,
        assetId: data.assetId,
        quantity: data.quantity,
        purpose: data.purpose,
        startDate,
        endDate,
        status: BookingStatus.PENDING,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        asset: { include: { category: true } },
      },
    });

    // Update asset availability immediately
    await prisma.asset.update({
      where: { id: data.assetId },
      data: { availableQuantity: newAvailable, status: newStatus as any },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: AuditAction.BOOKING_CREATED,
      entityType: 'Booking',
      entityId: booking.id,
      details: { assetName: asset.name, quantity: data.quantity },
    });

    await createNotification({
      userId: req.user!.id,
      type: NotificationType.BOOKING_SUBMITTED,
      title: 'Booking Submitted',
      message: `Your booking for ${asset.name} has been submitted and is awaiting approval.`,
      metadata: { bookingId: booking.id, assetId: asset.id },
    });

    return res.status(201).json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    return res.status(500).json({ error: 'Failed to create booking' });
  }
});

// PATCH approve/reject booking (admin only)
bookingsRouter.patch('/:id/review', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      action: z.enum(['approve', 'reject']),
      adminNote: z.string().optional(),
    });
    const { action, adminNote } = schema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { asset: true, user: true },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: 'Booking is not pending review' });
    }

    const newStatus = action === 'approve' ? BookingStatus.APPROVED : BookingStatus.REJECTED;

    let updated;
    if (action === 'reject') {
      // Restore availability since it was reserved at creation time
      const restoredAvailable = booking.asset.availableQuantity + booking.quantity;
      const restoredStatus = restoredAvailable >= booking.asset.totalQuantity ? 'AVAILABLE' : 'PARTIALLY_AVAILABLE';

      [updated] = await prisma.$transaction([
        prisma.booking.update({
          where: { id: req.params.id },
          data: { status: newStatus, adminNote },
          include: {
            user: { select: { id: true, name: true, email: true } },
            asset: { include: { category: true } },
          },
        }),
        prisma.asset.update({
          where: { id: booking.assetId },
          data: { availableQuantity: restoredAvailable, status: restoredStatus as any },
        }),
      ]);

      // Notify watchers that asset is back in stock
      const watchers = await prisma.notification.findMany({
        where: { metadata: { path: ['watchAssetId'], equals: booking.assetId }, type: 'BOOKING_DUE_SOON', isRead: false },
      });
      for (const watcher of watchers) {
        await prisma.notification.update({ where: { id: watcher.id }, data: { isRead: true } });
        await createNotification({
          userId: watcher.userId,
          type: NotificationType.ASSET_RETURNED,
          title: 'Asset Now Available!',
          message: `${booking.asset.name} is now available for booking!`,
          metadata: { assetId: booking.assetId },
        });
      }
    } else {
      updated = await prisma.booking.update({
        where: { id: req.params.id },
        data: { status: newStatus, adminNote },
        include: {
          user: { select: { id: true, name: true, email: true } },
          asset: { include: { category: true } },
        },
      });
    }

    await createAuditLog({
      userId: req.user!.id,
      action: action === 'approve' ? AuditAction.BOOKING_APPROVED : AuditAction.BOOKING_REJECTED,
      entityType: 'Booking',
      entityId: booking.id,
      details: { userName: booking.user.name, assetName: booking.asset.name, adminNote },
    });

    await createNotification({
      userId: booking.userId,
      type: action === 'approve' ? NotificationType.BOOKING_APPROVED : NotificationType.BOOKING_REJECTED,
      title: action === 'approve' ? 'Booking Approved ✓' : 'Booking Rejected',
      message: action === 'approve'
        ? `Your booking for ${booking.asset.name} has been approved.`
        : `Your booking for ${booking.asset.name} was rejected.${adminNote ? ' Note: ' + adminNote : ''}`,
      metadata: { bookingId: booking.id },
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    return res.status(500).json({ error: 'Failed to review booking' });
  }
});

// PATCH issue asset (admin only)
bookingsRouter.patch('/:id/issue', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { asset: true, user: true },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Booking must be approved before issuing' });
    }

    const [updated] = await prisma.$transaction([
      prisma.booking.update({
        where: { id: req.params.id },
        data: { status: BookingStatus.ISSUED, issuedAt: new Date() },
        include: { user: { select: { id: true, name: true, email: true } }, asset: { include: { category: true } } },
      }),
      prisma.asset.update({
        where: { id: booking.assetId },
        data: {
          availableQuantity: { decrement: booking.quantity },
          status: booking.asset.availableQuantity - booking.quantity <= 0 ? 'UNAVAILABLE' : 'PARTIALLY_AVAILABLE',
        },
      }),
    ]);

    await createAuditLog({
      userId: req.user!.id,
      action: AuditAction.ASSET_ISSUED,
      entityType: 'Booking',
      entityId: booking.id,
      details: { userName: booking.user.name, assetName: booking.asset.name, quantity: booking.quantity },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to issue asset' });
  }
});

// PATCH return asset (admin only)
bookingsRouter.patch('/:id/return', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { asset: true, user: true },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'ISSUED' && booking.status !== 'OVERDUE') {
      return res.status(400).json({ error: 'Asset is not currently issued' });
    }

    const newAvailable = booking.asset.availableQuantity + booking.quantity;
    const newStatus = newAvailable >= booking.asset.totalQuantity ? 'AVAILABLE' : 'PARTIALLY_AVAILABLE';

    const [updated] = await prisma.$transaction([
      prisma.booking.update({
        where: { id: req.params.id },
        data: { status: BookingStatus.RETURNED, returnedAt: new Date() },
        include: { user: { select: { id: true, name: true, email: true } }, asset: { include: { category: true } } },
      }),
      prisma.asset.update({
        where: { id: booking.assetId },
        data: {
          availableQuantity: { increment: booking.quantity },
          status: newStatus as any,
        },
      }),
    ]);

    await createAuditLog({
      userId: req.user!.id,
      action: AuditAction.ASSET_RETURNED,
      entityType: 'Booking',
      entityId: booking.id,
      details: { userName: booking.user.name, assetName: booking.asset.name, quantity: booking.quantity },
    });

    await createNotification({
      userId: booking.userId,
      type: NotificationType.ASSET_RETURNED,
      title: 'Asset Returned',
      message: `${booking.asset.name} has been marked as returned. Thank you!`,
      metadata: { bookingId: booking.id },
    });

    // Notify watchers that asset is back
    const watchers = await prisma.notification.findMany({
      where: { metadata: { path: ['watchAssetId'], equals: booking.assetId }, type: 'BOOKING_DUE_SOON', isRead: false },
    });
    for (const watcher of watchers) {
      await prisma.notification.update({ where: { id: watcher.id }, data: { isRead: true } });
      await createNotification({
        userId: watcher.userId,
        type: NotificationType.ASSET_RETURNED,
        title: 'Asset Now Available!',
        message: `${booking.asset.name} is now available for booking!`,
        metadata: { assetId: booking.assetId },
      });
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to return asset' });
  }
});

// PATCH cancel booking (user can cancel own pending/approved bookings)
bookingsRouter.patch('/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { asset: true },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (req.user!.role !== 'ADMIN' && booking.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!['PENDING', 'APPROVED'].includes(booking.status)) {
      return res.status(400).json({ error: 'Cannot cancel this booking' });
    }

    // Restore availability when cancelled
    const restoredAvailable = booking.asset.availableQuantity + booking.quantity;
    const restoredStatus = restoredAvailable >= booking.asset.totalQuantity ? 'AVAILABLE' : 'PARTIALLY_AVAILABLE';

    const [updated] = await prisma.$transaction([
      prisma.booking.update({
        where: { id: req.params.id },
        data: { status: BookingStatus.CANCELLED },
        include: { user: { select: { id: true, name: true, email: true } }, asset: { include: { category: true } } },
      }),
      prisma.asset.update({
        where: { id: booking.assetId },
        data: { availableQuantity: restoredAvailable, status: restoredStatus as any },
      }),
    ]);

    // Notify users who requested "notify me" for this asset
    const notifyWatchers = await prisma.notification.findMany({
      where: { metadata: { path: ['watchAssetId'], equals: booking.assetId }, type: 'BOOKING_DUE_SOON', isRead: false },
    });
    for (const watcher of notifyWatchers) {
      await prisma.notification.update({ where: { id: watcher.id }, data: { isRead: true } });
      await createNotification({
        userId: watcher.userId,
        type: NotificationType.ASSET_RETURNED,
        title: 'Asset Now Available!',
        message: `${booking.asset.name} is now available for booking!`,
        metadata: { assetId: booking.assetId },
      });
    }

    await createAuditLog({
      userId: req.user!.id,
      action: AuditAction.BOOKING_CANCELLED,
      entityType: 'Booking',
      entityId: booking.id,
      details: { assetName: booking.asset.name },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// PATCH user requests return
bookingsRouter.patch('/:id/request-return', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { asset: true, user: true },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.userId !== req.user!.id) return res.status(403).json({ error: 'Access denied' });
    if (booking.status !== 'ISSUED') return res.status(400).json({ error: 'Asset is not currently issued' });

    // Update booking note to indicate return requested
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { adminNote: 'RETURN_REQUESTED: User has requested to return this asset.' },
      include: { user: { select: { id: true, name: true, email: true } }, asset: { include: { category: true } } },
    });

    // Notify all admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: NotificationType.ASSET_RETURNED,
        title: 'Return Requested',
        message: `${booking.user.name} has requested to return ${booking.asset.name}. Please verify and mark as returned.`,
        metadata: { bookingId: booking.id, assetId: booking.assetId },
      });
    }

    await createAuditLog({
      userId: req.user!.id,
      action: AuditAction.ASSET_RETURNED,
      entityType: 'Booking',
      entityId: booking.id,
      details: { note: 'User requested return', assetName: booking.asset.name },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to request return' });
  }
});

// POST notify me when asset is available
bookingsRouter.post('/:assetId/notify-me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({ where: { id: req.params.assetId } });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    // Store as a special notification placeholder
    await createNotification({
      userId: req.user!.id,
      type: NotificationType.BOOKING_DUE_SOON,
      title: 'Watching Asset',
      message: `You will be notified when ${asset.name} becomes available.`,
      metadata: { watchAssetId: req.params.assetId, assetName: asset.name },
    });

    return res.json({ message: 'You will be notified when this asset is available!' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to set notification' });
  }
});
