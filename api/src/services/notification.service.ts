import type {
   NotificationChannel,
   NotificationType,
} from '../generated/prisma/client.js';
import { prisma } from '../config/prisma.js';
import { sendEmail } from './email.service.js';

export interface DispatchNotificationInput {
   type: NotificationType;
   channel: NotificationChannel;
   message: string;
   subject?: string;
   visitId?: number;
   invitationId?: number;
   recipientUserId?: number;
   recipientEmail?: string;
}

/**
 * Single entry point other modules use to raise a notification, e.g.
 * from Visits: "generate QR → dispatchNotification → return visit."
 * Callers never write to the Notification table or an email provider
 * directly — this is the one place that logic lives.
 *
 * A DASHBOARD notification is just the created row (the dashboard
 * module reads it back via its own inbox endpoints). An EMAIL
 * notification also attempts delivery and stamps sentAt on success.
 * A send failure is logged and swallowed rather than thrown — the
 * notification row still exists for audit/retry, and a delivery
 * failure shouldn't fail the caller's own operation (e.g. approving
 * a visit) mid-flight.
 */
export const dispatchNotification = async (
   input: DispatchNotificationInput,
): Promise<void> => {
   const notification = await prisma.notification.create({
      data: {
         type: input.type,
         channel: input.channel,
         message: input.message,
         subject: input.subject,
         visitId: input.visitId,
         invitationId: input.invitationId,
         recipientUserId: input.recipientUserId,
         recipientEmail: input.recipientEmail,
      },
   });

   if (input.channel !== 'EMAIL' || !input.recipientEmail) {
      return;
   }

   try {
      await sendEmail(input.recipientEmail, input.subject ?? '', input.message);

      await prisma.notification.update({
         where: { id: notification.id },
         data: { sentAt: new Date() },
      });
   } catch (error) {
      // TODO: route to structured logging (pino/winston) once wired up.
      console.error(`Failed to send notification ${notification.id}:`, error);
   }
};
