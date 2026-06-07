import { AuditAction } from '@prisma/client';
import { prisma } from './prisma';

interface AuditOptions {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export const createAuditLog = async (options: AuditOptions) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: options.userId,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        details: options.details as any,
        ipAddress: options.ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};
