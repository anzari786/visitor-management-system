import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import {
   BadRequestError,
   ConflictError,
   NotFoundError,
} from '../../lib/errors.js';
import { generateQrToken } from '../../services/qr.service.js';
import {
   printJobSelect,
   printJobWithAttendanceSelect,
} from './print-job.types.js';
import type {
   BadgePrintData,
   PrintJobRecord,
   PrintJobWithAttendance,
} from './print-job.types.js';

const ACTIVE_STATUSES = ['QUEUED', 'PRINTING'] as const;
const TERMINAL_STATUSES = ['PRINTED', 'FAILED', 'CANCELLED'] as const;

const formatDateLabel = (date: Date): string => {
   const y = date.getFullYear();
   const m = String(date.getMonth() + 1).padStart(2, '0');
   const d = String(date.getDate()).padStart(2, '0');
   return `${y}-${m}-${d}`;
};

export const formatPrintJob = (job: PrintJobRecord) => ({
   id: String(job.id),
   attendanceId: String(job.attendanceId),
   status: job.status,
   attemptCount: job.attemptCount,
   requestedAt: job.requestedAt,
   printedAt: job.printedAt ?? undefined,
   errorMessage: job.errorMessage ?? undefined,
   claimedBy: job.claimedBy ?? undefined,
   claimedAt: job.claimedAt ?? undefined,
   createdAt: job.createdAt,
   updatedAt: job.updatedAt,
});

export const toBadgePrintData = (
   job: PrintJobWithAttendance,
   brandPrefix?: string,
): BadgePrintData => {
   const visitor = job.attendance.participant.visitor;
   const visit = job.attendance.participant.visit;
   const badgeToken = job.attendance.badgeToken;

   if (!badgeToken) {
      throw new BadRequestError('Attendance is missing a badge token');
   }

   return {
      jobId: job.id,
      attendanceId: job.attendanceId,
      badgeToken,
      visitorName: `${visitor.firstName} ${visitor.lastName}`.trim(),
      organization: visitor.organization ?? visit.organization ?? undefined,
      visitCode: visit.visitCode,
      date: formatDateLabel(job.attendance.visitDay.date),
      hostName: visit.hostNameSnapshot ?? undefined,
      floor: visit.floor ?? undefined,
      room: visit.room ?? undefined,
      brandPrefix,
   };
};

/**
 * Creates a QUEUED print job for an attendance if none is already active.
 * Idempotent across API retries / duplicate check-in attempts.
 */
export const enqueueBadgePrintJob = async (
   attendanceId: number,
): Promise<PrintJobRecord> => {
   const existing = await prisma.badgePrintJob.findFirst({
      where: {
         attendanceId,
         status: { in: [...ACTIVE_STATUSES] },
      },
      select: printJobSelect,
      orderBy: { requestedAt: 'desc' },
   });

   if (existing) {
      return existing;
   }

   // Ensure opaque badge token exists before queuing.
   const attendance = await prisma.visitAttendance.findUnique({
      where: { id: attendanceId },
      select: { id: true, badgeToken: true, status: true },
   });

   if (!attendance) {
      throw new NotFoundError('Attendance record not found');
   }

   if (attendance.status !== 'CHECKED_IN') {
      throw new BadRequestError(
         'Print jobs can only be created for checked-in attendances',
      );
   }

   if (!attendance.badgeToken) {
      await prisma.visitAttendance.update({
         where: { id: attendanceId },
         data: { badgeToken: generateQrToken() },
      });
   }

   try {
      return await prisma.badgePrintJob.create({
         data: {
            attendanceId,
            status: 'QUEUED',
            activeAttendanceId: attendanceId,
            attemptCount: 0,
            requestedAt: new Date(),
         },
         select: printJobSelect,
      });
   } catch (error) {
      // Concurrent enqueue — unique activeAttendanceId won the race.
      if (
         error instanceof Prisma.PrismaClientKnownRequestError &&
         error.code === 'P2002'
      ) {
         const raced = await prisma.badgePrintJob.findFirst({
            where: {
               attendanceId,
               status: { in: [...ACTIVE_STATUSES] },
            },
            select: printJobSelect,
            orderBy: { requestedAt: 'desc' },
         });
         if (raced) return raced;
      }
      throw error;
   }
};

/** Re-queues a FAILED (or recoverable) job for another print attempt. */
export const retryBadgePrintJob = async (
   jobId: number,
): Promise<PrintJobRecord> => {
   const job = await prisma.badgePrintJob.findUnique({
      where: { id: jobId },
      select: printJobSelect,
   });

   if (!job) {
      throw new NotFoundError('Print job not found');
   }

   if (job.status === 'QUEUED' || job.status === 'PRINTING') {
      return job;
   }

   if (job.status === 'CANCELLED') {
      throw new BadRequestError('Cancelled print jobs cannot be retried');
   }

   // PRINTED or FAILED → allow desk to reprint (new active claim slot).
   const active = await prisma.badgePrintJob.findFirst({
      where: {
         attendanceId: job.attendanceId,
         status: { in: [...ACTIVE_STATUSES] },
      },
      select: { id: true },
   });

   if (active) {
      throw new ConflictError(
         'An active print job already exists for this attendance',
      );
   }

   return prisma.badgePrintJob.update({
      where: { id: jobId },
      data: {
         status: 'QUEUED',
         activeAttendanceId: job.attendanceId,
         errorMessage: null,
         printedAt: null,
         claimedBy: null,
         claimedAt: null,
         requestedAt: new Date(),
      },
      select: printJobSelect,
   });
};

export const retryPrintForAttendance = async (
   attendanceId: number,
): Promise<PrintJobRecord> => {
   const latest = await prisma.badgePrintJob.findFirst({
      where: { attendanceId },
      select: printJobSelect,
      orderBy: { requestedAt: 'desc' },
   });

   if (!latest) {
      return enqueueBadgePrintJob(attendanceId);
   }

   if (latest.status === 'QUEUED' || latest.status === 'PRINTING') {
      return latest;
   }

   return retryBadgePrintJob(latest.id);
};

const recoverStalePrintingJobs = async () => {
   const staleBefore = new Date(Date.now() - env.PRINT_JOB_STALE_MS);

   await prisma.badgePrintJob.updateMany({
      where: {
         status: 'PRINTING',
         claimedAt: { lt: staleBefore },
      },
      data: {
         status: 'QUEUED',
         claimedBy: null,
         claimedAt: null,
         errorMessage: 'Recovered after stale PRINTING claim',
      },
   });
};

/**
 * Attempts a single atomic claim of the next QUEUED job.
 * Returns null if the queue is currently empty (or the claim was lost to a race).
 */
const attemptClaim = async (
   agentId: string,
   brandSetting: { value: string } | null,
): Promise<{ job: PrintJobRecord; printData: BadgePrintData } | null> => {
   return prisma.$transaction(async (tx) => {
      const next = await tx.badgePrintJob.findFirst({
         where: { status: 'QUEUED' },
         orderBy: { requestedAt: 'asc' },
         select: { id: true },
      });

      if (!next) {
         return null;
      }

      const claimed = await tx.badgePrintJob.updateMany({
         where: { id: next.id, status: 'QUEUED' },
         data: {
            status: 'PRINTING',
            claimedBy: agentId,
            claimedAt: new Date(),
            attemptCount: { increment: 1 },
            errorMessage: null,
         },
      });

      if (claimed.count !== 1) {
         // Lost the race to another agent.
         return null;
      }

      const job = await tx.badgePrintJob.findUnique({
         where: { id: next.id },
         select: printJobWithAttendanceSelect,
      });

      if (!job) {
         return null;
      }

      return {
         job: {
            id: job.id,
            attendanceId: job.attendanceId,
            status: job.status,
            attemptCount: job.attemptCount,
            requestedAt: job.requestedAt,
            printedAt: job.printedAt,
            errorMessage: job.errorMessage,
            claimedBy: job.claimedBy,
            claimedAt: job.claimedAt,
            activeAttendanceId: job.activeAttendanceId,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
         },
         printData: toBadgePrintData(job, brandSetting?.value),
      };
   });
};

const sleep = (ms: number) =>
   new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Long-polls for the next QUEUED job, checking every CHECK_INTERVAL_MS
 * until either a job is claimed or waitMs elapses.
 */
export const claimNextPrintJob = async (
   agentId: string,
   waitMs = 0,
): Promise<{ job: PrintJobRecord; printData: BadgePrintData } | null> => {
   const deadline = Date.now() + waitMs;

   await recoverStalePrintingJobs();

   const brandSetting = await prisma.systemSetting.findUnique({
      where: { key: 'badgePrefix' },
      select: { value: true },
   });

   while (true) {
      const claimed = await attemptClaim(agentId, brandSetting);
      if (claimed) return claimed;

      const remaining = deadline - Date.now();
      if (remaining <= 0) return null;

      await sleep(Math.min(env.PRINT_JOB_CHECK_INTERVAL_MS, remaining));
   }
};

/** Optional heartbeat / explicit claim affirmation while printing. */
export const markPrintJobPrinting = async (
   jobId: number,
   agentId: string,
): Promise<PrintJobRecord> => {
   const job = await prisma.badgePrintJob.findUnique({
      where: { id: jobId },
      select: printJobSelect,
   });

   if (!job) {
      throw new NotFoundError('Print job not found');
   }

   if (job.status === 'PRINTED') {
      throw new ConflictError('Print job already completed');
   }

   if (job.status === 'CANCELLED') {
      throw new BadRequestError('Print job is cancelled');
   }

   if (
      job.status === 'PRINTING' &&
      job.claimedBy &&
      job.claimedBy !== agentId
   ) {
      throw new ConflictError('Print job is claimed by another agent');
   }

   return prisma.badgePrintJob.update({
      where: { id: jobId },
      data: {
         status: 'PRINTING',
         claimedBy: agentId,
         claimedAt: new Date(),
         ...(job.status === 'QUEUED' ? { attemptCount: { increment: 1 } } : {}),
      },
      select: printJobSelect,
   });
};

export const completePrintJob = async (
   jobId: number,
   agentId: string,
): Promise<PrintJobRecord> => {
   const job = await prisma.badgePrintJob.findUnique({
      where: { id: jobId },
      select: printJobSelect,
   });

   if (!job) {
      throw new NotFoundError('Print job not found');
   }

   if (job.status === 'PRINTED') {
      return job;
   }

   if (job.status !== 'PRINTING' && job.status !== 'QUEUED') {
      throw new BadRequestError(
         `Cannot complete print job in status ${job.status}`,
      );
   }

   if (job.claimedBy && job.claimedBy !== agentId) {
      throw new ConflictError('Print job is claimed by another agent');
   }

   const printedAt = new Date();

   const [updated] = await prisma.$transaction([
      prisma.badgePrintJob.update({
         where: { id: jobId },
         data: {
            status: 'PRINTED',
            printedAt,
            activeAttendanceId: null,
            errorMessage: null,
            claimedBy: agentId,
            claimedAt: job.claimedAt ?? printedAt,
         },
         select: printJobSelect,
      }),
      prisma.visitAttendance.update({
         where: { id: job.attendanceId },
         data: { badgePrintedAt: printedAt },
      }),
   ]);

   return updated;
};

export const failPrintJob = async (
   jobId: number,
   agentId: string,
   errorMessage: string,
): Promise<PrintJobRecord> => {
   const job = await prisma.badgePrintJob.findUnique({
      where: { id: jobId },
      select: printJobSelect,
   });

   if (!job) {
      throw new NotFoundError('Print job not found');
   }

   if (job.status === 'PRINTED') {
      throw new ConflictError('Print job already completed');
   }

   if (job.status === 'CANCELLED') {
      throw new BadRequestError('Print job is cancelled');
   }

   if (job.claimedBy && job.claimedBy !== agentId) {
      throw new ConflictError('Print job is claimed by another agent');
   }

   return prisma.badgePrintJob.update({
      where: { id: jobId },
      data: {
         status: 'FAILED',
         errorMessage: errorMessage.slice(0, 2000),
         activeAttendanceId: null,
         claimedBy: agentId,
      },
      select: printJobSelect,
   });
};

export const getPrintJobById = async (
   jobId: number,
): Promise<PrintJobRecord> => {
   const job = await prisma.badgePrintJob.findUnique({
      where: { id: jobId },
      select: printJobSelect,
   });

   if (!job) {
      throw new NotFoundError('Print job not found');
   }

   return job;
};

export const getLatestPrintJobForAttendance = async (
   attendanceId: number,
): Promise<PrintJobRecord | null> => {
   return prisma.badgePrintJob.findFirst({
      where: { attendanceId },
      select: printJobSelect,
      orderBy: { requestedAt: 'desc' },
   });
};

/** Exported for tests / recovery hooks. */
export const recoverStaleJobs = recoverStalePrintingJobs;

export const isTerminalPrintStatus = (
   status: string,
): status is (typeof TERMINAL_STATUSES)[number] =>
   (TERMINAL_STATUSES as readonly string[]).includes(status);
