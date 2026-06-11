import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { createNotification } from '../utils/notifications';
import { createAuditLog } from '../utils/audit';
import { AuditAction, NotificationType } from '@prisma/client';

export const suggestionsRouter = Router();

// GET all suggestions (admin sees all, user sees their own)
suggestionsRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Record<string, unknown> = {};
    if (req.user!.role !== 'ADMIN') where.userId = req.user!.id;
    if (status) where.status = status;

    const [suggestions, total] = await Promise.all([
      prisma.assetSuggestion.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, department: true } } },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.assetSuggestion.count({ where }),
    ]);

    return res.json({ suggestions, total });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// POST create suggestion (user)
suggestionsRouter.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      assetName: z.string().min(2).max(200),
      category: z.string().min(1),
      reason: z.string().min(10).max(1000),
      quantity: z.number().int().positive().optional(),
      urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    });
    const data = schema.parse(req.body);

    const suggestion = await prisma.assetSuggestion.create({
      data: {
        userId: req.user!.id,
        assetName: data.assetName,
        category: data.category,
        reason: data.reason,
        quantity: data.quantity || 1,
        urgency: data.urgency || 'MEDIUM',
        status: 'PENDING',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: NotificationType.BOOKING_SUBMITTED,
        title: 'New Asset Suggestion',
        message: `${req.user!.name} suggested adding "${data.assetName}" to the inventory.`,
        metadata: { suggestionId: suggestion.id },
      });
    }

    // Notify user
    await createNotification({
      userId: req.user!.id,
      type: NotificationType.BOOKING_SUBMITTED,
      title: 'Suggestion Submitted',
      message: `Your suggestion for "${data.assetName}" has been submitted and will be reviewed by admin.`,
      metadata: { suggestionId: suggestion.id },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: AuditAction.BOOKING_CREATED,
      entityType: 'AssetSuggestion',
      entityId: suggestion.id,
      details: { assetName: data.assetName, category: data.category },
    });

    return res.status(201).json(suggestion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    return res.status(500).json({ error: 'Failed to submit suggestion' });
  }
});

// PATCH review suggestion (admin)
suggestionsRouter.patch('/:id/review', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      status: z.enum(['APPROVED', 'REJECTED', 'ADDED']),
      adminNote: z.string().optional(),
    });
    const { status, adminNote } = schema.parse(req.body);

    const suggestion = await prisma.assetSuggestion.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });
    if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });

    const updated = await prisma.assetSuggestion.update({
      where: { id: req.params.id },
      data: { status, adminNote, reviewedAt: new Date() },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Notify the user
    const messages: Record<string, string> = {
      APPROVED: `Great news! Your suggestion for "${suggestion.assetName}" has been approved and will be added soon.`,
      REJECTED: `Your suggestion for "${suggestion.assetName}" was reviewed but won't be added at this time.${adminNote ? ' Note: ' + adminNote : ''}`,
      ADDED: `Your suggestion for "${suggestion.assetName}" has been added to the inventory! You can now book it.`,
    };

    await createNotification({
      userId: suggestion.userId,
      type: status === 'REJECTED' ? NotificationType.BOOKING_REJECTED : NotificationType.BOOKING_APPROVED,
      title: status === 'APPROVED' ? 'Suggestion Approved!' : status === 'ADDED' ? 'Asset Added to Inventory!' : 'Suggestion Reviewed',
      message: messages[status],
      metadata: { suggestionId: suggestion.id },
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    return res.status(500).json({ error: 'Failed to review suggestion' });
  }
});

// DELETE suggestion (user can delete their own pending ones)
suggestionsRouter.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const suggestion = await prisma.assetSuggestion.findUnique({ where: { id: req.params.id } });
    if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });
    if (req.user!.role !== 'ADMIN' && suggestion.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await prisma.assetSuggestion.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Suggestion deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete suggestion' });
  }
});
