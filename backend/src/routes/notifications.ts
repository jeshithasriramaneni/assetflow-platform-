import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const notificationsRouter = Router();

// GET user notifications
notificationsRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', unreadOnly } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Record<string, unknown> = { userId: req.user!.id };
    if (unreadOnly === 'true') where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
    ]);

    return res.json({ notifications, total, unreadCount });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH mark notification as read
notificationsRouter.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification || notification.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    return res.json({ message: 'Marked as read' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

// PATCH mark all as read
notificationsRouter.patch('/mark-all-read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// DELETE notification
notificationsRouter.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification || notification.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    await prisma.notification.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Notification deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
});
