import type { ReactElement } from 'react';
import type {
   NotificationChannel,
   NotificationType,
} from '../generated/prisma/client.js';
import { enqueueNotificationDispatch } from '../jobs/notification-dispatch.job.js';

export interface DispatchNotificationInput {
   type: NotificationType;
   channel: NotificationChannel;
   /** Inbox / email body text (plain). */
   message: string;
   /** Dashboard notification title. */
   title?: string;
   /** Email subject line. */
   subject?: string;
   visitId?: number;
   recipientUserId?: number;
   recipientEmail?: string;
   /** React Email element — preferred for EMAIL channel. */
   react?: ReactElement;
}

/**
 * Enqueue notification work for background processing so API requests return
 * without waiting on dashboard writes or SMTP delivery.
 */
export const dispatchNotification = async (
   input: DispatchNotificationInput,
): Promise<void> => {
   enqueueNotificationDispatch(input);
};

/** Fan-out helper for several dashboard recipients of the same event. */
export const dispatchDashboardNotifications = async (
   recipientUserIds: number[],
   input: Omit<
      DispatchNotificationInput,
      'channel' | 'recipientUserId' | 'recipientEmail' | 'react'
   >,
): Promise<void> => {
   const uniqueIds = [...new Set(recipientUserIds.filter(Boolean))];

   await Promise.all(
      uniqueIds.map((recipientUserId) =>
         dispatchNotification({
            ...input,
            channel: 'DASHBOARD',
            recipientUserId,
         }),
      ),
   );
};
