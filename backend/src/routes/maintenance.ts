import { Router, Response } from 'express';
import { z } from 'zod';
import { AssetCondition, AuditAction } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';

export const maintenanceRouter = Router();

// GET maintenance logs for an asset
maintenanceRouter.get('/asset/:assetId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.maintenanceLog.findMany({
      where: { assetId: req.params.assetId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch maintenance logs' });
  }
});

// POST create maintenance log (admin only)
maintenanceRouter.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      assetId: z.string().uuid(),
      description: z.string().min(5),
      condition: z.nativeEnum(AssetCondition),
      cost: z.number().optional(),
      resolvedAt: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const log = await prisma.maintenanceLog.create({
      data: {
        description: data.description,
        condition: data.condition,
        cost: data.cost ?? null,
        resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : null,
        reportedBy: req.user!.id,
        asset: { connect: { id: data.assetId } },
      },
    });

    // Update asset condition
    await prisma.asset.update({
      where: { id: data.assetId },
      data: {
        condition: data.condition,
        status: data.condition === AssetCondition.DAMAGED ? 'MAINTENANCE' : undefined,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: AuditAction.CONDITION_UPDATED,
      entityType: 'Asset',
      entityId: data.assetId,
      details: { condition: data.condition, description: data.description },
    });

    return res.status(201).json(log);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: error.errors });
    return res.status(500).json({ error: 'Failed to create maintenance log' });
  }
});

