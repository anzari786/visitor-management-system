import type {
   NotificationChannel,
   NotificationType,
   Prisma,
} from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import { getSkipTake, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationParams } from '../../utils/pagination.js';
import { notificationSelect } from './notification.types.js';
import type { NotificationWithSelect } from './notification.types.js';

interface ListNotificationsFilters extends PaginationParams {
   isRead?: boolean;
   type?: NotificationType;
   channel?: NotificationChannel;
}

/**
 * Always scoped to the requesting user's own inbox — recipientUserId
 * comes from the session, never from client input, so one user can
 * never page through another's notifications.
 */
export const listMyNotifications = async (
   recipientUserId: number,
   filters: ListNotificationsFilters,
) => {
   const where: Prisma.NotificationWhereInput = {
      recipientUserId,
      ...(filters.isRead !== undefined && { isRead: filters.isRead }),
      ...(filters.type && { type: filters.type }),
      ...(filters.channel && { channel: filters.channel }),
   };

   const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
         where,
         select: notificationSelect,
         orderBy: { createdAt: 'desc' },
         ...getSkipTake(filters),
      }),
      prisma.notification.count({ where }),
   ]);

   return {
      notifications,
      meta: buildPaginationMeta(filters, total),
   };
};

export const getUnreadCount = async (
   recipientUserId: number,
): Promise<number> => {
   return prisma.notification.count({
      where: { recipientUserId, isRead: false },
   });
};

export const getMyNotificationById = async (
   recipientUserId: number,
   id: number,
): Promise<NotificationWithSelect> => {
   const notification = await prisma.notification.findFirst({
      where: { id, recipientUserId },
      select: notificationSelect,
   });

   if (!notification) {
      throw new NotFoundError('Notification not found');
   }

   return notification;
};

export const markNotificationRead = async (
   recipientUserId: number,
   id: number,
): Promise<NotificationWithSelect> => {
   await getMyNotificationById(recipientUserId, id);

   return prisma.notification.update({
      where: { id },
      data: { isRead: true },
      select: notificationSelect,
   });
};

export const markAllNotificationsRead = async (recipientUserId: number) => {
   const result = await prisma.notification.updateMany({
      where: { recipientUserId, isRead: false },
      data: { isRead: true },
   });

   return { updatedCount: result.count };
};

export const formatNotification = (notification: NotificationWithSelect) => ({
   id: String(notification.id),
   type: notification.type,
   channel: notification.channel,
   subject: notification.subject ?? undefined,
   message: notification.message,
   isRead: notification.isRead,
   sentAt: notification.sentAt ?? undefined,
   createdAt: notification.createdAt,
   visitId: notification.visitId ? String(notification.visitId) : undefined,
   invitationId: notification.invitationId
      ? String(notification.invitationId)
      : undefined,
});
