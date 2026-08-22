import type { Prisma } from '../../generated/prisma/client.js';

export const notificationSelect = {
   id: true,
   type: true,
   channel: true,
   title: true,
   subject: true,
   message: true,
   isRead: true,
   sentAt: true,
   createdAt: true,
   visitId: true,
} satisfies Prisma.NotificationSelect;

export type NotificationWithSelect = Prisma.NotificationGetPayload<{
   select: typeof notificationSelect;
}>;
