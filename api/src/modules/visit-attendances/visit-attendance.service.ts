import type {
   AttendanceStatus,
   Prisma,
   VisitStatus,
} from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import { getSkipTake, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationParams } from '../../utils/pagination.js';
import { generateQrToken } from '../../services/qr.service.js';
import {
   enqueueBadgePrintJob,
   formatPrintJob,
   getLatestPrintJobForAttendance,
   retryPrintForAttendance,
} from '../print-jobs/print-job.service.js';
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
   expectedVisitorCount: true,
   organization: true,
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
               badgeToken: true,
               badgePrintedAt: true,
               participantId: true,
               printJobs: {
                  select: {
                     id: true,
                     status: true,
                     errorMessage: true,
                  },
                  orderBy: { requestedAt: 'desc' as const },
                  take: 1,
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

const latestPrintJob = (attendance: {
   printJobs: Array<{
      id: number;
      status: string;
      attemptCount?: number;
      requestedAt?: Date;
      printedAt?: Date | null;
      errorMessage?: string | null;
      createdAt?: Date;
      updatedAt?: Date;
   }>;
}) => attendance.printJobs[0] ?? null;

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
export const findVisitForCheckIn = async (code: string, date?: Date) => {
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
      const printJob = attendance ? latestPrintJob(attendance) : null;

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
                 badgePrintedAt: attendance.badgePrintedAt ?? undefined,
                 printJob: printJob
                    ? {
                         id: String(printJob.id),
                         status: printJob.status,
                         errorMessage: printJob.errorMessage ?? undefined,
                      }
                    : undefined,
              }
            : {
                 id: undefined,
                 status: 'EXPECTED' as const,
                 checkInAt: undefined,
                 checkOutAt: undefined,
                 badgePrintedAt: undefined,
                 printJob: undefined,
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
      expectedVisitorCount: visit.expectedVisitorCount,
      registeredCount: visit.participants.length,
      organization: visit.organization ?? undefined,
      reason: !CHECK_IN_ELIGIBLE_VISIT_STATUSES.includes(visit.status)
         ? `Visit is not eligible for check-in (status: ${visit.status})`
         : !visitDay
           ? 'No visit day scheduled for the selected date'
           : undefined,
      visitors,
   };
};

/**
 * Resolves the currently checked-in attendance from a printed badge QR token.
 * Does not perform check-out. Token is opaque — never visitor PII.
 */
export const findVisitorForCheckOut = async (code: string) => {
   const token = code.trim();

   const attendance = await prisma.visitAttendance.findFirst({
      where: {
         badgeToken: token,
         status: 'CHECKED_IN',
      },
      select: attendanceDetailSelect,
      orderBy: { checkInAt: 'desc' },
   });

   if (!attendance) {
      // Distinguish unknown token vs known but not checked-in.
      const any = await prisma.visitAttendance.findFirst({
         where: { badgeToken: token },
         select: {
            id: true,
            status: true,
            badgeToken: true,
         },
      });

      if (!any) {
         throw new NotFoundError(
            'No attendance found for the provided badge token',
         );
      }

      return {
         eligibleForCheckOut: false,
         reason: `Visitor is not currently checked in (status: ${any.status})`,
         attendance: null,
         badgeToken: any.badgeToken ?? token,
      };
   }

   return {
      eligibleForCheckOut: true,
      reason: undefined,
      badgeToken: attendance.badgeToken ?? token,
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
 * Checks a visitor in for a given visit day, then queues a thermal badge
 * print job. Printer failures never roll back a successful check-in.
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

   if (!CHECK_IN_ELIGIBLE_VISIT_STATUSES.includes(participant.visit.status)) {
      throw new BadRequestError('Visit must be approved before check-in');
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

   // Idempotent: already checked in → ensure print job exists, return current.
   if (attendance.status === 'CHECKED_IN') {
      await enqueueBadgePrintJob(attendance.id);
      return getAttendanceById(attendance.id);
   }

   assertTransition(attendance.status, ['EXPECTED']);

   const badgeToken = attendance.badgeToken ?? generateQrToken();

   const updated = await prisma.visitAttendance.update({
      where: { id: attendance.id },
      data: {
         status: 'CHECKED_IN',
         checkInAt: new Date(),
         checkedInById: actorId,
         badgeToken,
         personalIdRetained: input.retainPersonalId,
      },
      select: attendanceDetailSelect,
   });

   // Queue print after check-in persists — failure here must not undo check-in.
   try {
      await enqueueBadgePrintJob(updated.id);
   } catch (error) {
      console.error('Failed to enqueue badge print job after check-in', error);
   }

   await refreshVisitAttendanceStatus(participant.visitId, actorId);

   await notifyVisitorArrived(updated.participant.visit, [
      updated.participant.visitor,
   ]);

   return getAttendanceById(updated.id);
};

/**
 * Checks a visitor out. Disposable badges are not returned to inventory;
 * print history is retained for audit.
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

export const retryAttendanceBadgePrint = async (attendanceId: number) => {
   const attendance = await prisma.visitAttendance.findUnique({
      where: { id: attendanceId },
      select: { id: true, status: true },
   });

   if (!attendance) {
      throw new NotFoundError('Attendance record not found');
   }

   if (attendance.status !== 'CHECKED_IN' && attendance.status !== 'CHECKED_OUT') {
      throw new BadRequestError(
         'Badge print retry requires a checked-in or checked-out attendance',
      );
   }

   return retryPrintForAttendance(attendanceId);
};

export const getAttendancePrintStatus = async (attendanceId: number) => {
   await getAttendanceById(attendanceId);
   const job = await getLatestPrintJobForAttendance(attendanceId);
   return job ? formatPrintJob(job) : null;
};

/**
 * Derives visit-level attendance status from individual attendance rows.
 */
const refreshVisitAttendanceStatus = async (
   visitId: number,
   actorId: number,
) => {
   const [visit, attendances, registeredCount, dayCount] = await Promise.all([
      prisma.visit.findUnique({ where: { id: visitId } }),
      prisma.visitAttendance.findMany({
         where: { participant: { visitId } },
         select: { status: true },
      }),
      prisma.visitParticipant.count({ where: { visitId } }),
      prisma.visitDay.count({ where: { visitId } }),
   ]);

   if (!visit || attendances.length === 0) {
      return;
   }

   const checkedIn = attendances.filter((a) => a.status === 'CHECKED_IN').length;
   const checkedOut = attendances.filter(
      (a) => a.status === 'CHECKED_OUT',
   ).length;
   const total = attendances.length;
   const expectedSlots = visit.expectedVisitorCount * Math.max(dayCount, 1);
   const allExpectedRegistered = registeredCount >= visit.expectedVisitorCount;

   let nextStatus = visit.status;

   if (checkedIn > 0 && checkedOut === 0) {
      const allRegisteredCheckedIn =
         checkedIn === total && allExpectedRegistered;
      nextStatus = allRegisteredCheckedIn
         ? checkedIn >= expectedSlots
            ? 'CHECKED_IN'
            : 'PARTIALLY_CHECKED_IN'
         : 'PARTIALLY_CHECKED_IN';
   } else if (checkedOut > 0 && checkedIn === 0) {
      const allRegisteredCheckedOut =
         checkedOut === total && allExpectedRegistered;
      nextStatus = allRegisteredCheckedOut
         ? checkedOut >= expectedSlots
            ? 'CHECKED_OUT'
            : 'PARTIALLY_CHECKED_OUT'
         : 'PARTIALLY_CHECKED_OUT';
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

export const formatAttendanceDetail = (attendance: AttendanceDetail) => {
   const printJob = latestPrintJob(attendance);

   return {
      id: String(attendance.id),
      status: attendance.status,
      badgeToken: attendance.badgeToken ?? undefined,
      badgePrintedAt: attendance.badgePrintedAt ?? undefined,
      personalIdRetained: attendance.personalIdRetained,
      personalIdReturnedAt: attendance.personalIdReturnedAt ?? undefined,
      checkInAt: attendance.checkInAt ?? undefined,
      checkOutAt: attendance.checkOutAt ?? undefined,
      printJob: printJob
         ? {
              id: String(printJob.id),
              status: printJob.status,
              attemptCount: printJob.attemptCount,
              requestedAt: printJob.requestedAt,
              printedAt: printJob.printedAt ?? undefined,
              errorMessage: printJob.errorMessage ?? undefined,
           }
         : undefined,
      visitor: {
         id: String(attendance.participant.visitor.id),
         firstName: attendance.participant.visitor.firstName,
         lastName: attendance.participant.visitor.lastName,
         phone: attendance.participant.visitor.phone ?? undefined,
         email: attendance.participant.visitor.email ?? undefined,
         organization:
            attendance.participant.visitor.organization ?? undefined,
      },
      visit: {
         id: String(attendance.participant.visit.id),
         visitCode: attendance.participant.visit.visitCode,
         status: attendance.participant.visit.status,
         floor: attendance.participant.visit.floor ?? undefined,
         room: attendance.participant.visit.room ?? undefined,
         hostName:
            attendance.participant.visit.hostNameSnapshot ?? undefined,
      },
      visitDay: {
         id: String(attendance.visitDay.id),
         date: attendance.visitDay.date,
      },
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
   };
};

export const formatAttendanceSummary = (attendance: AttendanceSummary) => {
   const printJob = latestPrintJob(attendance);

   return {
      id: String(attendance.id),
      status: attendance.status,
      checkInAt: attendance.checkInAt ?? undefined,
      checkOutAt: attendance.checkOutAt ?? undefined,
      badgePrintedAt: attendance.badgePrintedAt ?? undefined,
      visitorName: `${attendance.participant.visitor.firstName} ${attendance.participant.visitor.lastName}`,
      visitorPhone: attendance.participant.visitor.phone ?? undefined,
      visit: {
         id: String(attendance.participant.visit.id),
         visitCode: attendance.participant.visit.visitCode,
         status: attendance.participant.visit.status,
      },
      scheduleDate: attendance.visitDay.date,
      printStatus: printJob?.status,
   };
};
