import type {
   AttendanceStatus,
   Prisma,
   VisitStatus,
} from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import { getSkipTake, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationParams } from '../../utils/pagination.js';
import { assignBadge, releaseBadge } from '../badges/badge.service.js';
import {
   notifyVisitorArrived,
   notifyVisitorCheckedOut,
} from '../../services/visit-notifications.service.js';
import {
   attendanceDetailSelect,
   attendanceSummarySelect,
} from './visit-attendance.types.js';
import type {
   AttendanceDetail,
   AttendanceSummary,
   CheckInInput,
} from './visit-attendance.types.js';

const CHECK_IN_ELIGIBLE_VISIT_STATUSES: VisitStatus[] = [
   'APPROVED',
   'RESCHEDULED',
   'PARTIALLY_CHECKED_IN',
   'CHECKED_IN',
   'PARTIALLY_CHECKED_OUT',
];

const startOfDay = (date: Date): Date => {
   const copy = new Date(date);
   copy.setHours(0, 0, 0, 0);
   return copy;
};

const sameCalendarDay = (a: Date, b: Date) =>
   startOfDay(a).getTime() === startOfDay(b).getTime();

const visitLookupSelect = {
   id: true,
   visitCode: true,
   qrToken: true,
   source: true,
   groupType: true,
   durationType: true,
   status: true,
   purpose: true,
   floor: true,
   room: true,
   startDate: true,
   endDate: true,
   startTime: true,
   endTime: true,
   hostNameSnapshot: true,
   departmentNameSnapshot: true,
   hostEmployee: {
      select: {
         id: true,
         firstName: true,
         lastName: true,
         email: true,
         departmentName: true,
      },
   },
   days: {
      select: {
         id: true,
         date: true,
         attendances: {
            select: {
               id: true,
               status: true,
               checkInAt: true,
               checkOutAt: true,
               badgeId: true,
               participantId: true,
               badge: {
                  select: {
                     id: true,
                     badgeNumber: true,
                     status: true,
                  },
               },
            },
         },
      },
      orderBy: { date: 'asc' as const },
   },
   participants: {
      select: {
         id: true,
         visitor: {
            select: {
               id: true,
               firstName: true,
               lastName: true,
               phone: true,
               email: true,
               organization: true,
               idType: true,
               idNumber: true,
            },
         },
      },
   },
} satisfies Prisma.VisitSelect;

type VisitLookupRecord = Prisma.VisitGetPayload<{
   select: typeof visitLookupSelect;
}>;

const assertTransition = (
   current: AttendanceStatus,
   allowed: AttendanceStatus[],
) => {
   if (!allowed.includes(current)) {
      throw new BadRequestError(
         `Attendance cannot be changed from its current status (${current})`,
      );
   }
};

export const getAttendanceById = async (
   id: number,
): Promise<AttendanceDetail> => {
   const attendance = await prisma.visitAttendance.findUnique({
      where: { id },
      select: attendanceDetailSelect,
   });

   if (!attendance) {
      throw new NotFoundError('Attendance record not found');
   }

   return attendance;
};

interface ListAttendanceFilters extends PaginationParams {
   visitId?: number;
   status?: AttendanceStatus;
   date?: Date;
   search?: string;
}

export const listAttendances = async (filters: ListAttendanceFilters) => {
   const where: Prisma.VisitAttendanceWhereInput = {
      ...(filters.visitId && {
         participant: { visitId: filters.visitId },
      }),
      ...(filters.status && { status: filters.status }),
      ...(filters.date && {
         visitDay: { date: startOfDay(filters.date) },
      }),
      ...(filters.search && {
         participant: {
            visitor: {
               OR: [
                  { firstName: { contains: filters.search } },
                  { lastName: { contains: filters.search } },
                  { phone: { contains: filters.search } },
               ],
            },
         },
      }),
   };

   const [attendances, total] = await Promise.all([
      prisma.visitAttendance.findMany({
         where,
         select: attendanceSummarySelect,
         orderBy: { createdAt: 'desc' },
         ...getSkipTake(filters),
      }),
      prisma.visitAttendance.count({ where }),
   ]);

   return {
      attendances,
      meta: buildPaginationMeta(filters, total),
   };
};

export const listDailyAttendances = async (
   pagination: PaginationParams,
   date?: Date,
) => {
   return listAttendances({ ...pagination, date: date ?? new Date() });
};

/**
 * Resolves a visit from its QR token (preferred) or human-readable visit code.
 * Returns check-in eligibility and per-visitor attendance for the target day
 * (defaults to today). Does not perform check-in.
 */
export const findVisitForCheckIn = async (
   code: string,
   date?: Date,
) => {
   const token = code.trim();
   const visit = await prisma.visit.findFirst({
      where: {
         OR: [{ qrToken: token }, { visitCode: token }],
      },
      select: visitLookupSelect,
   });

   if (!visit) {
      throw new NotFoundError('Visit not found for the provided code');
   }

   const targetDate = startOfDay(date ?? new Date());
   const visitDay =
      visit.days.find((day) => sameCalendarDay(day.date, targetDate)) ?? null;

   const eligibleForCheckIn =
      CHECK_IN_ELIGIBLE_VISIT_STATUSES.includes(visit.status) &&
      visitDay !== null;

   const attendanceByParticipant = new Map(
      (visitDay?.attendances ?? []).map((row) => [row.participantId, row]),
   );

   const visitors = visit.participants.map((participant) => {
      const attendance = attendanceByParticipant.get(participant.id) ?? null;
      const canCheckIn =
         eligibleForCheckIn &&
         (attendance === null || attendance.status === 'EXPECTED');

      return {
         participantId: String(participant.id),
         visitor: {
            id: String(participant.visitor.id),
            firstName: participant.visitor.firstName,
            lastName: participant.visitor.lastName,
            phone: participant.visitor.phone ?? undefined,
            email: participant.visitor.email ?? undefined,
            organization: participant.visitor.organization ?? undefined,
            idType: participant.visitor.idType ?? undefined,
            idNumber: participant.visitor.idNumber ?? undefined,
         },
         attendance: attendance
            ? {
                 id: String(attendance.id),
                 status: attendance.status,
                 checkInAt: attendance.checkInAt ?? undefined,
                 checkOutAt: attendance.checkOutAt ?? undefined,
                 badge: attendance.badge
                    ? {
                         id: String(attendance.badge.id),
                         badgeNumber: attendance.badge.badgeNumber,
                         status: attendance.badge.status,
                      }
                    : undefined,
              }
            : {
                 id: undefined,
                 status: 'EXPECTED' as const,
                 checkInAt: undefined,
                 checkOutAt: undefined,
                 badge: undefined,
              },
         canCheckIn,
      };
   });

   return {
      visit: formatVisitLookup(visit),
      visitDay: visitDay
         ? { id: String(visitDay.id), date: visitDay.date }
         : null,
      eligibleForCheckIn,
      reason: !CHECK_IN_ELIGIBLE_VISIT_STATUSES.includes(visit.status)
         ? `Visit is not eligible for check-in (status: ${visit.status})`
         : !visitDay
           ? 'No visit day scheduled for the selected date'
           : undefined,
      visitors,
   };
};

/**
 * Resolves the currently assigned, checked-in attendance from a badge QR
 * token (preferred) or badge number. Does not perform check-out.
 */
export const findVisitorForCheckOut = async (code: string) => {
   const token = code.trim();
   const badge = await prisma.badge.findFirst({
      where: {
         OR: [{ qrToken: token }, { badgeNumber: token }],
      },
      select: {
         id: true,
         badgeNumber: true,
         qrToken: true,
         status: true,
      },
   });

   if (!badge) {
      throw new NotFoundError('Badge not found for the provided code');
   }

   if (badge.status !== 'ASSIGNED') {
      return {
         badge: {
            id: String(badge.id),
            badgeNumber: badge.badgeNumber,
            status: badge.status,
         },
         eligibleForCheckOut: false,
         reason: `Badge is not currently assigned (status: ${badge.status})`,
         attendance: null,
      };
   }

   const attendance = await prisma.visitAttendance.findFirst({
      where: {
         badgeId: badge.id,
         status: 'CHECKED_IN',
      },
      select: attendanceDetailSelect,
      orderBy: { checkInAt: 'desc' },
   });

   if (!attendance) {
      return {
         badge: {
            id: String(badge.id),
            badgeNumber: badge.badgeNumber,
            status: badge.status,
         },
         eligibleForCheckOut: false,
         reason: 'No active checked-in attendance found for this badge',
         attendance: null,
      };
   }

   return {
      badge: {
         id: String(badge.id),
         badgeNumber: badge.badgeNumber,
         status: badge.status,
      },
      eligibleForCheckOut: true,
      reason: undefined,
      attendance: formatAttendanceDetail(attendance),
   };
};

const formatVisitLookup = (visit: VisitLookupRecord) => ({
   id: String(visit.id),
   visitCode: visit.visitCode,
   source: visit.source,
   groupType: visit.groupType,
   durationType: visit.durationType,
   status: visit.status,
   purpose: visit.purpose,
   floor: visit.floor ?? undefined,
   room: visit.room ?? undefined,
   startDate: visit.startDate,
   endDate: visit.endDate,
   startTime: visit.startTime,
   endTime: visit.endTime,
   hostName: visit.hostNameSnapshot ?? undefined,
   departmentName: visit.departmentNameSnapshot ?? undefined,
   host: visit.hostEmployee
      ? {
           id: String(visit.hostEmployee.id),
           firstName: visit.hostEmployee.firstName,
           lastName: visit.hostEmployee.lastName,
           email: visit.hostEmployee.email,
           departmentName: visit.hostEmployee.departmentName,
        }
      : undefined,
   days: visit.days.map((day) => ({
      id: String(day.id),
      date: day.date,
   })),
});

/**
 * Checks a visitor in for a given visit day.
 * Creates the attendance row on demand when it does not yet exist.
 */
export const checkInVisitor = async (
   input: CheckInInput,
   actorId: number,
): Promise<AttendanceDetail> => {
   const participant = await prisma.visitParticipant.findUnique({
      where: { id: input.visitParticipantId },
      include: { visit: true },
   });

   if (!participant) {
      throw new NotFoundError('Visit participant not found');
   }

   if (
      !CHECK_IN_ELIGIBLE_VISIT_STATUSES.includes(participant.visit.status)
   ) {
      throw new BadRequestError(
         'Visit must be approved before check-in',
      );
   }

   const visitDay = await prisma.visitDay.findUnique({
      where: { id: input.visitDayId },
   });

   if (!visitDay || visitDay.visitId !== participant.visitId) {
      throw new NotFoundError('Visit day not found for this visit');
   }

   let attendance = await prisma.visitAttendance.findUnique({
      where: {
         participantId_visitDayId: {
            participantId: input.visitParticipantId,
            visitDayId: input.visitDayId,
         },
      },
   });

   if (!attendance) {
      attendance = await prisma.visitAttendance.create({
         data: {
            participantId: input.visitParticipantId,
            visitDayId: input.visitDayId,
            status: 'EXPECTED',
         },
      });
   }

   assertTransition(attendance.status, ['EXPECTED']);

   if (input.badgeId) {
      await assignBadge(input.badgeId);
   }

   const updated = await prisma.visitAttendance.update({
      where: { id: attendance.id },
      data: {
         status: 'CHECKED_IN',
         checkInAt: new Date(),
         checkedInById: actorId,
         ...(input.badgeId && {
            badgeId: input.badgeId,
            badgeAssignedAt: new Date(),
         }),
         personalIdRetained: input.retainPersonalId,
      },
      select: attendanceDetailSelect,
   });

   await refreshVisitAttendanceStatus(participant.visitId, actorId);

   await notifyVisitorArrived(updated.participant.visit, [
      updated.participant.visitor,
   ]);

   return updated;
};

/**
 * Checks a visitor out, releases their badge if assigned, and refreshes
 * the parent visit attendance status.
 */
export const checkOutVisitor = async (
   id: number,
   actorId: number,
): Promise<AttendanceDetail> => {
   const attendance = await prisma.visitAttendance.findUnique({
      where: { id },
      include: { participant: true },
   });

   if (!attendance) {
      throw new NotFoundError('Attendance record not found');
   }

   assertTransition(attendance.status, ['CHECKED_IN']);

   if (attendance.badgeId) {
      await releaseBadge(attendance.badgeId);
   }

   const updated = await prisma.visitAttendance.update({
      where: { id },
      data: {
         status: 'CHECKED_OUT',
         checkOutAt: new Date(),
         checkedOutById: actorId,
         ...(attendance.personalIdRetained && {
            personalIdReturnedAt: new Date(),
         }),
      },
      select: attendanceDetailSelect,
   });

   await notifyVisitorCheckedOut(updated.participant.visit, [
      updated.participant.visitor,
   ]);

   await refreshVisitAttendanceStatus(
      attendance.participant.visitId,
      actorId,
   );

   return updated;
};

/**
 * Derives visit-level attendance status from individual attendance rows.
 */
const refreshVisitAttendanceStatus = async (
   visitId: number,
   actorId: number,
) => {
   const [visit, attendances] = await Promise.all([
      prisma.visit.findUnique({ where: { id: visitId } }),
      prisma.visitAttendance.findMany({
         where: { participant: { visitId } },
         select: { status: true },
      }),
   ]);

   if (!visit || attendances.length === 0) {
      return;
   }

   const checkedIn = attendances.filter((a) => a.status === 'CHECKED_IN').length;
   const checkedOut = attendances.filter(
      (a) => a.status === 'CHECKED_OUT',
   ).length;
   const total = attendances.length;

   let nextStatus = visit.status;

   if (checkedIn > 0 && checkedOut === 0) {
      nextStatus =
         checkedIn === total ? 'CHECKED_IN' : 'PARTIALLY_CHECKED_IN';
   } else if (checkedOut > 0 && checkedIn === 0) {
      nextStatus =
         checkedOut === total ? 'CHECKED_OUT' : 'PARTIALLY_CHECKED_OUT';
   } else if (checkedIn > 0 && checkedOut > 0) {
      nextStatus = 'PARTIALLY_CHECKED_OUT';
   }

   if (nextStatus === visit.status) {
      return;
   }

   await prisma.visit.update({
      where: { id: visitId },
      data: {
         status: nextStatus,
         statusHistory: {
            create: {
               fromStatus: visit.status,
               toStatus: nextStatus,
               changedById: actorId,
            },
         },
      },
   });
};

/** Marks a still-EXPECTED slot as unattended — typically an end-of-day sweep. */
export const markNoShow = async (id: number): Promise<AttendanceDetail> => {
   const attendance = await getAttendanceById(id);

   assertTransition(attendance.status, ['EXPECTED']);

   return prisma.visitAttendance.update({
      where: { id },
      data: { status: 'NO_SHOW' },
      select: attendanceDetailSelect,
   });
};

export const formatAttendanceDetail = (attendance: AttendanceDetail) => ({
   id: String(attendance.id),
   status: attendance.status,
   badgeAssignedAt: attendance.badgeAssignedAt ?? undefined,
   personalIdRetained: attendance.personalIdRetained,
   personalIdReturnedAt: attendance.personalIdReturnedAt ?? undefined,
   checkInAt: attendance.checkInAt ?? undefined,
   checkOutAt: attendance.checkOutAt ?? undefined,
   visitor: {
      id: String(attendance.participant.visitor.id),
      firstName: attendance.participant.visitor.firstName,
      lastName: attendance.participant.visitor.lastName,
      phone: attendance.participant.visitor.phone ?? undefined,
      email: attendance.participant.visitor.email ?? undefined,
   },
   visit: {
      id: String(attendance.participant.visit.id),
      visitCode: attendance.participant.visit.visitCode,
      status: attendance.participant.visit.status,
   },
   visitDay: {
      id: String(attendance.visitDay.id),
      date: attendance.visitDay.date,
   },
   badge: attendance.badge
      ? {
           id: String(attendance.badge.id),
           badgeNumber: attendance.badge.badgeNumber,
           status: attendance.badge.status,
        }
      : undefined,
   checkedInBy: attendance.checkedInBy
      ? {
           firstName: attendance.checkedInBy.firstName,
           lastName: attendance.checkedInBy.lastName,
        }
      : undefined,
   checkedOutBy: attendance.checkedOutBy
      ? {
           firstName: attendance.checkedOutBy.firstName,
           lastName: attendance.checkedOutBy.lastName,
        }
      : undefined,
   createdAt: attendance.createdAt,
   updatedAt: attendance.updatedAt,
});

export const formatAttendanceSummary = (attendance: AttendanceSummary) => ({
   id: String(attendance.id),
   status: attendance.status,
   checkInAt: attendance.checkInAt ?? undefined,
   checkOutAt: attendance.checkOutAt ?? undefined,
   visitorName: `${attendance.participant.visitor.firstName} ${attendance.participant.visitor.lastName}`,
   visitorPhone: attendance.participant.visitor.phone ?? undefined,
   visit: {
      id: String(attendance.participant.visit.id),
      visitCode: attendance.participant.visit.visitCode,
      status: attendance.participant.visit.status,
   },
   scheduleDate: attendance.visitDay.date,
   badgeNumber: attendance.badge?.badgeNumber,
});
