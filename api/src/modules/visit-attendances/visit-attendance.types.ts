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
   participant: {
      select: {
         id: true,
         visitId: true,
         visitor: {
            select: {
               id: true,
               firstName: true,
               lastName: true,
               phone: true,
               email: true,
            },
         },
         visit: {
            select: {
               id: true,
               visitCode: true,
               status: true,
               purpose: true,
               floor: true,
               room: true,
               startDate: true,
               endDate: true,
               startTime: true,
               endTime: true,
               hostNameSnapshot: true,
               hostEmailSnapshot: true,
               departmentNameSnapshot: true,
               hostEmployee: {
                  select: {
                     id: true,
                     firstName: true,
                     lastName: true,
                     email: true,
                     departmentName: true,
                     user: { select: { id: true } },
                  },
               },
               participants: {
                  select: {
                     visitor: {
                        select: {
                           firstName: true,
                           lastName: true,
                           email: true,
                        },
                     },
                  },
               },
               days: {
                  select: { date: true },
                  orderBy: { date: 'asc' },
               },
            },
         },
      },
   },
   visitDay: {
      select: {
         id: true,
         date: true,
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
         firstName: true,
         lastName: true,
      },
   },
   checkedOutBy: {
      select: {
         id: true,
         firstName: true,
         lastName: true,
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
   participant: {
      select: {
         visitor: {
            select: { firstName: true, lastName: true, phone: true },
         },
         visit: {
            select: { id: true, visitCode: true, status: true },
         },
      },
   },
   visitDay: {
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
   visitDayId: number;
   badgeId?: number;
   retainPersonalId: boolean;
}
