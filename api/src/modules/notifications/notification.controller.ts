import type { Request, Response } from 'express';
import type { z } from 'zod';
import {
   listMyNotifications,
   getUnreadCount,
   getMyNotificationById,
   markNotificationRead,
   markAllNotificationsRead,
   formatNotification,
} from './notification.service.js';
import type {
   listNotificationsSchema,
   notificationIdParamSchema,
} from './notification.validation.js';

type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>['query'];
type NotificationIdParams = z.infer<typeof notificationIdParamSchema>['params'];

export const getNotifications = async (req: Request, res: Response) => {
   const { type, channel, page, limit } =
      req.validatedQuery as ListNotificationsQuery;

   const { notifications, meta } = await listMyNotifications(
      req.session.userId!,
      {
         isRead: false,
         type,
         channel,
         page,
         limit,
      },
   );

   return res.status(200).json({
      success: true,
      data: notifications.map(formatNotification),
      pagination: meta,
   });
};

export const getUnreadNotificationCount = async (
   req: Request,
   res: Response,
) => {
   const unreadCount = await getUnreadCount(req.session.userId!);

   return res.status(200).json({
      success: true,
      data: { unreadCount },
   });
};

export const patchNotificationRead = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as NotificationIdParams;

   const notification = await markNotificationRead(req.session.userId!, id);

   return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: formatNotification(notification),
   });
};

export const postMarkAllRead = async (req: Request, res: Response) => {
   const result = await markAllNotificationsRead(req.session.userId!);

   return res.status(200).json({
      success: true,
      message: `Marked ${result.updatedCount} notification(s) as read`,
      data: result,
   });
};
