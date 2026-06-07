import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

export const analyticsRouter = Router();

// GET dashboard summary stats (admin)
analyticsRouter.get('/summary', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalAssets,
      totalUsers,
      activeBookings,
      pendingApprovals,
      overdueBookings,
      recentBookings,
      totalCategories,
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.booking.count({ where: { status: { in: ['APPROVED', 'ISSUED'] } } }),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'ISSUED', endDate: { lt: now } } }),
      prisma.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.category.count(),
    ]);

    const assetUtilization = await prisma.asset.aggregate({
      _sum: { totalQuantity: true, availableQuantity: true },
    });

    const totalQty = assetUtilization._sum.totalQuantity || 0;
    const availableQty = assetUtilization._sum.availableQuantity || 0;
    const utilizationRate = totalQty > 0 ? ((totalQty - availableQty) / totalQty * 100).toFixed(1) : '0';

    return res.json({
      totalAssets,
      totalUsers,
      activeBookings,
      pendingApprovals,
      overdueBookings,
      recentBookings,
      totalCategories,
      utilizationRate: parseFloat(utilizationRate),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET most used assets
analyticsRouter.get('/top-assets', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const topAssets = await prisma.booking.groupBy({
      by: ['assetId'],
      _count: { assetId: true },
      orderBy: { _count: { assetId: 'desc' } },
      take: 10,
    });

    const assetDetails = await Promise.all(
      topAssets.map(async (item) => {
        const asset = await prisma.asset.findUnique({
          where: { id: item.assetId },
          include: { category: true },
        });
        return { ...asset, bookingCount: item._count.assetId };
      })
    );

    return res.json(assetDetails.filter(Boolean));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch top assets' });
  }
});

// GET booking trends (last 30 days)
analyticsRouter.get('/booking-trends', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const days = 30;
    const trends = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.booking.count({
        where: { createdAt: { gte: date, lt: nextDate } },
      });

      trends.push({
        date: date.toISOString().split('T')[0],
        bookings: count,
      });
    }

    return res.json(trends);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch booking trends' });
  }
});

// GET category utilization breakdown
analyticsRouter.get('/category-stats', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        assets: {
          select: { totalQuantity: true, availableQuantity: true },
        },
      },
    });

    const stats = categories.map((cat) => {
      const total = cat.assets.reduce((sum, a) => sum + a.totalQuantity, 0);
      const available = cat.assets.reduce((sum, a) => sum + a.availableQuantity, 0);
      const utilized = total - available;
      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        totalAssets: cat.assets.length,
        totalQuantity: total,
        availableQuantity: available,
        utilizedQuantity: utilized,
        utilizationRate: total > 0 ? Math.round((utilized / total) * 100) : 0,
      };
    });

    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch category stats' });
  }
});

// GET booking status distribution
analyticsRouter.get('/booking-status', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const statusCounts = await prisma.booking.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return res.json(
      statusCounts.map((s) => ({
        status: s.status,
        count: s._count.status,
      }))
    );
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch booking status' });
  }
});

// GET user summary (for user dashboard)
analyticsRouter.get('/my-stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [total, active, pending, returned, overdue] = await Promise.all([
      prisma.booking.count({ where: { userId } }),
      prisma.booking.count({ where: { userId, status: { in: ['APPROVED', 'ISSUED'] } } }),
      prisma.booking.count({ where: { userId, status: 'PENDING' } }),
      prisma.booking.count({ where: { userId, status: 'RETURNED' } }),
      prisma.booking.count({ where: { userId, status: 'ISSUED', endDate: { lt: new Date() } } }),
    ]);

    return res.json({ total, active, pending, returned, overdue });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});
