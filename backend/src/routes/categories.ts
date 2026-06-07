import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

export const categoriesRouter = Router();

categoriesRouter.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { name: 'asc' },
    });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

categoriesRouter.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const category = await prisma.category.create({ data });
    return res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: error.errors });
    return res.status(500).json({ error: 'Failed to create category' });
  }
});

categoriesRouter.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const category = await prisma.category.update({ where: { id: req.params.id }, data });
    return res.json(category);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update category' });
  }
});

categoriesRouter.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const hasAssets = await prisma.asset.count({ where: { categoryId: req.params.id } });
    if (hasAssets > 0) return res.status(400).json({ error: 'Category has assets. Reassign them first.' });
    await prisma.category.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Category deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete category' });
  }
});
