import type { Prisma } from '../../generated/prisma/client.js';

/** Full record shape for the attendance detail view. */
export const attendanceDetailSelect = {
   id: true,
   status: true,
   badgeAssignedAt: true,
   personalIdRetained: true,
   personalIdReturnedAt: true,
   checkInAt: true,
   checkOutAt: true,
   createdAt: true,
   updatedAt: true,
   visitParticipant: {
      select: {
         id: true,
         visitId: true,
         visitor: {
            select: {
               id: true,
               firstName: true,
               lastName: true,
               phone: true,
            },
         },
         visit: {
            select: {
               id: true,
               visitCode: true,
               status: true,
               hostEmailSnapshot: true,
               hostEmployee: {
                  select: {
                     id: true,
                     firstName: true,
                     lastName: true,
                     email: true,
                     user: { select: { id: true } },
                  },
               },
            },
         },
      },
   },
   visitSchedule: {
      select: {
         id: true,
         date: true,
         expectedStartTime: true,
         expectedEndTime: true,
      },
   },
   badge: {
      select: {
         id: true,
         badgeNumber: true,
         status: true,
      },
   },
   checkedInBy: {
      select: {
         id: true,
         employee: { select: { firstName: true, lastName: true } },
      },
   },
   checkedOutBy: {
      select: {
         id: true,
         employee: { select: { firstName: true, lastName: true } },
      },
   },
} satisfies Prisma.VisitAttendanceSelect;

export type AttendanceDetail = Prisma.VisitAttendanceGetPayload<{
   select: typeof attendanceDetailSelect;
}>;

/** Lighter shape for the list/daily-board view. */
export const attendanceSummarySelect = {
   id: true,
   status: true,
   checkInAt: true,
   checkOutAt: true,
   visitParticipant: {
      select: {
         visitor: {
            select: { firstName: true, lastName: true, phone: true },
         },
         visit: {
            select: { id: true, visitCode: true, status: true },
         },
      },
   },
   visitSchedule: {
      select: { date: true },
   },
   badge: {
      select: { badgeNumber: true },
   },
} satisfies Prisma.VisitAttendanceSelect;

export type AttendanceSummary = Prisma.VisitAttendanceGetPayload<{
   select: typeof attendanceSummarySelect;
}>;

export interface CheckInInput {
   visitParticipantId: number;
   visitScheduleId: number;
   badgeId?: number;
   retainPersonalId: boolean;
}