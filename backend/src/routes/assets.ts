import { Router, Response } from 'express';
import { z } from 'zod';
import QRCode from 'qrcode';
import { AssetStatus, AssetCondition, AuditAction } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';

export const assetsRouter = Router();

const assetSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  totalQuantity: z.number().int().positive(),
  availableQuantity: z.number().int().min(0).optional(),
  status: z.nativeEnum(AssetStatus).optional(),
  condition: z.nativeEnum(AssetCondition).optional(),
  location: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
});

// GET all assets (with filters)
assetsRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { search, categoryId, status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { serialNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: { category: true },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.asset.count({ where }),
    ]);

    return res.json({ assets, total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// GET single asset
assetsRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        bookings: {
          where: { status: { in: ['PENDING', 'APPROVED', 'ISSUED'] } },
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { startDate: 'asc' },
        },
        maintenanceLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    return res.json(asset);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// GET asset by QR code
assetsRouter.get('/qr/:qrCode', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { qrCode: req.params.qrCode },
      include: { category: true },
    });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    return res.json(asset);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// POST create asset (admin only)
assetsRouter.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = assetSchema.parse(req.body);
    const qrCode = `ASSET-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrCode);

   const asset = await prisma.asset.create({
  data: {
    name: data.name,
    description: data.description,
    totalQuantity: data.totalQuantity,
    availableQuantity: data.availableQuantity ?? data.totalQuantity,
    status: data.status ?? AssetStatus.AVAILABLE,
    condition: data.condition ?? AssetCondition.GOOD,
    location: data.location,
    serialNumber: data.serialNumber,
    purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
    warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : undefined,
    notes: data.notes,
    qrCode,
    imageUrl: qrCodeDataUrl,

    category: {
      connect: {
        id: data.categoryId,
      },
    },
  },
  include: {
    category: true,
  },
});
    await createAuditLog({
      userId: req.user!.id,
      action: AuditAction.ASSET_CREATED,
      entityType: 'Asset',
      entityId: asset.id,
      details: { name: asset.name, categoryId: asset.categoryId },
    });

    return res.status(201).json(asset);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    return res.status(500).json({ error: 'Failed to create asset' });
  }
});

// PATCH update asset (admin only)
assetsRouter.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = assetSchema.partial().parse(req.body);
    const existing = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Asset not found' });

    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : undefined,
      },
      include: { category: true },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: AuditAction.ASSET_UPDATED,
      entityType: 'Asset',
      entityId: asset.id,
      details: { name: asset.name, changes: data },
    });

    return res.json(asset);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    return res.status(500).json({ error: 'Failed to update asset' });
  }
});

// DELETE asset (admin only)
assetsRouter.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Asset not found' });

    const activeBookings = await prisma.booking.count({
      where: { assetId: req.params.id, status: { in: ['PENDING', 'APPROVED', 'ISSUED'] } },
    });
    if (activeBookings > 0) {
      return res.status(400).json({ error: 'Cannot delete asset with active bookings' });
    }

    await prisma.asset.delete({ where: { id: req.params.id } });

    await createAuditLog({
      userId: req.user!.id,
      action: AuditAction.ASSET_DELETED,
      entityType: 'Asset',
      entityId: req.params.id,
      details: { name: existing.name },
    });

    return res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// Generate QR code for asset
assetsRouter.get('/:id/qrcode', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    if (!asset.qrCode) return res.status(404).json({ error: 'No QR code for this asset' });

    const qrDataUrl = await QRCode.toDataURL(asset.qrCode, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });
    return res.json({ qrCode: asset.qrCode, qrDataUrl, assetName: asset.name });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate QR code' });
  }
});
