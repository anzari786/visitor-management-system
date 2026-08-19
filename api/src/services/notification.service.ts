import type { ReactElement } from 'react';
import type {
   NotificationChannel,
   NotificationType,
} from '../generated/prisma/client.js';
import { prisma } from '../config/prisma.js';
import { sendTemplatedEmail, sendEmail } from './email.service.js';

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
 * Single entry point for dashboard + email notifications.
 *
 * - DASHBOARD: persists an inbox row for `recipientUserId`
 * - EMAIL: persists a delivery/audit row and attempts SMTP send
 *
 * Delivery failures are logged and swallowed so visit workflows continue.
 */
export const dispatchNotification = async (
   input: DispatchNotificationInput,
): Promise<void> => {
   const notification = await prisma.notification.create({
      data: {
         type: input.type,
         channel: input.channel,
         title: input.title,
         message: input.message,
         subject: input.subject,
         visitId: input.visitId,
         recipientUserId: input.recipientUserId,
         recipientEmail: input.recipientEmail,
      },
   });

   if (input.channel !== 'EMAIL' || !input.recipientEmail) {
      return;
   }

   try {
      if (input.react) {
         await sendTemplatedEmail({
            to: input.recipientEmail,
            subject: input.subject ?? input.title ?? 'ATI VMS notification',
            text: input.message,
            react: input.react,
         });
      } else {
         await sendEmail({
            to: input.recipientEmail,
            subject: input.subject ?? input.title ?? 'ATI VMS notification',
            text: input.message,
         });
      }

      await prisma.notification.update({
         where: { id: notification.id },
         data: { sentAt: new Date() },
      });
   } catch (error) {
      console.error(`Failed to send notification ${notification.id}:`, error);
   }
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
