import { NotificationType } from '@prisma/client';
import { prisma } from './prisma';

interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export const createNotification = async (options: CreateNotificationOptions) => {
  try {
    await prisma.notification.create({
      data: {
        userId: options.userId,
        type: options.type,
        title: options.title,
        message: options.message,
        metadata: options.metadata as any,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

export const createBulkNotifications = async (notifications: CreateNotificationOptions[]) => {
  try {
    await prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        metadata: n.metadata as any,
      })),
    });
  } catch (error) {
    console.error('Failed to create bulk notifications:', error);
  }
};
