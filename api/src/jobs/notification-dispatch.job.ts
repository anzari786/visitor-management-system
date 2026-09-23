import type { DispatchNotificationInput } from '../services/notification.service.js';
import { prisma } from '../config/prisma.js';
import { sendEmail, sendTemplatedEmail } from '../services/email.service.js';
import { registerIntervalJob } from './scheduler.js';

type QueuedNotificationJob = {
   key: string;
   input: DispatchNotificationInput;
   attempts: number;
};

const MAX_RETRIES = 5;
const notificationQueue: QueuedNotificationJob[] = [];
const queuedNotificationKeys = new Set<string>();
const inFlightNotificationKeys = new Set<string>();
let notificationDispatchRegistered = false;

const buildNotificationKey = (input: DispatchNotificationInput): string => {
   const signature = {
      type: input.type,
      channel: input.channel,
      title: input.title ?? null,
      subject: input.subject ?? null,
      message: input.message,
      visitId: input.visitId ?? null,
      recipientUserId: input.recipientUserId ?? null,
      recipientEmail: input.recipientEmail ?? null,
   };

   return JSON.stringify(signature);
};

export const enqueueNotificationDispatch = (
   input: DispatchNotificationInput,
): void => {
   const key = buildNotificationKey(input);

   if (queuedNotificationKeys.has(key) || inFlightNotificationKeys.has(key)) {
      return;
   }

   queuedNotificationKeys.add(key);
   notificationQueue.push({ key, input, attempts: 0 });
};

const persistNotification = async (input: DispatchNotificationInput) =>
   prisma.notification.create({
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

const processQueuedEmailNotification = async (
   notificationId: number,
   input: DispatchNotificationInput,
): Promise<void> => {
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
         where: { id: notificationId },
         data: { sentAt: new Date() },
      });
   } catch (error) {
      console.error(
         `[notification-dispatch] Failed to deliver queued email notification ${notificationId}:`,
         error,
      );
      throw error;
   }
};

const processQueuedNotificationJob = async (
   job: QueuedNotificationJob,
): Promise<void> => {
   const notification = await persistNotification(job.input);

   try {
      await processQueuedEmailNotification(notification.id, job.input);
   } catch (error) {
      throw error;
   }
};

export const processQueuedNotifications = async (): Promise<void> => {
   if (notificationQueue.length === 0) {
      return;
   }

   const jobs = [...notificationQueue];
   notificationQueue.length = 0;

   for (const job of jobs) {
      queuedNotificationKeys.delete(job.key);
      inFlightNotificationKeys.add(job.key);

      try {
         await processQueuedNotificationJob(job);
         inFlightNotificationKeys.delete(job.key);
         queuedNotificationKeys.delete(job.key);
      } catch (error) {
         inFlightNotificationKeys.delete(job.key);
         console.error(
            `[notification-dispatch] Queued notification failed for ${job.key}:`,
            error,
         );

         if (job.attempts >= MAX_RETRIES) {
            console.error(
               `[notification-dispatch] Dropping notification after ${MAX_RETRIES} retries: ${job.key}`,
            );
            continue;
         }

         const retryJob = {
            ...job,
            attempts: job.attempts + 1,
         };

         queuedNotificationKeys.add(job.key);
         notificationQueue.push(retryJob);
      }
   }
};

export const registerNotificationDispatchJob = (): void => {
   if (notificationDispatchRegistered) {
      return;
   }

   notificationDispatchRegistered = true;

   registerIntervalJob(
      'notification-dispatch',
      60_000,
      processQueuedNotifications,
   );
};
