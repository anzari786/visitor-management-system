import type { Prisma } from '../../generated/prisma/client.js';

/** Payload sent to the Print Agent for ZPL generation (no PII in QR). */
export interface BadgePrintData {
   jobId: number;
   attendanceId: number;
   /** Opaque token for the badge QR — never visitor PII. */
   badgeToken: string;
   visitorName: string;
   organization?: string;
   visitCode: string;
   date: string;
   hostName?: string;
   floor?: string;
   room?: string;
   brandPrefix?: string;
}

export const printJobSelect = {
   id: true,
   attendanceId: true,
   status: true,
   attemptCount: true,
   requestedAt: true,
   printedAt: true,
   errorMessage: true,
   claimedBy: true,
   claimedAt: true,
   activeAttendanceId: true,
   createdAt: true,
   updatedAt: true,
} satisfies Prisma.BadgePrintJobSelect;

export type PrintJobRecord = Prisma.BadgePrintJobGetPayload<{
   select: typeof printJobSelect;
}>;

/** Attendance + visit context needed to build BadgePrintData. */
export const printJobWithAttendanceSelect = {
   ...printJobSelect,
   attendance: {
      select: {
         id: true,
         badgeToken: true,
         badgePrintedAt: true,
         status: true,
         visitDay: {
            select: {
               date: true,
            },
         },
         participant: {
            select: {
               visitor: {
                  select: {
                     firstName: true,
                     lastName: true,
                     organization: true,
                  },
               },
               visit: {
                  select: {
                     visitCode: true,
                     floor: true,
                     room: true,
                     hostNameSnapshot: true,
                     organization: true,
                  },
               },
            },
         },
      },
   },
} satisfies Prisma.BadgePrintJobSelect;

export type PrintJobWithAttendance = Prisma.BadgePrintJobGetPayload<{
   select: typeof printJobWithAttendanceSelect;
}>;
