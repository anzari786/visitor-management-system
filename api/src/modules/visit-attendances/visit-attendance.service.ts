import type {
   NotificationType,
   Prisma,
   VisitAttendanceStatus,
} from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import { getSkipTake, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationParams } from '../../utils/pagination.js';
import { assignBadge, releaseBadge } from '../badges/badge.service.js';
import { dispatchNotification } from '../../services/notification.service.js';
import {
   attendanceDetailSelect,
   attendanceSummarySelect,
} from './visit-attendance.types.js';
import type {
   AttendanceDetail,
   AttendanceSummary,
   CheckInInput,
} from './visit-attendance.types.js';

const assertTransition = (
   current: VisitAttendanceStatus,
   allowed: VisitAttendanceStatus[],
) => {
   if (!allowed.includes(current)) {
      throw new BadRequestError(
         `Attendance cannot be changed from its current status (${current})`,
      );
   }
};

const startOfDay = (date: Date): Date => {
   const copy = new Date(date);
   copy.setHours(0, 0, 0, 0);
   return copy;
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
   visitScheduleId?: number;
   visitParticipantId?: number;
   status?: VisitAttendanceStatus;
   badgeId?: number;
   date?: Date;
}

export const listAttendances = async (filters: ListAttendanceFilters) => {
   const where: Prisma.VisitAttendanceWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.badgeId && { badgeId: filters.badgeId }),
      ...(filters.visitParticipantId && {
         visitParticipantId: filters.visitParticipantId,
      }),
      ...(filters.visitScheduleId && {
         visitScheduleId: filters.visitScheduleId,
      }),
      ...(filters.visitId && {
         visitParticipant: { visitId: filters.visitId },
      }),
      ...(filters.date && {
         visitSchedule: { date: startOfDay(filters.date) },
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
   date: Date | undefined,
   pagination: PaginationParams,
) => {
   return listAttendances({ ...pagination, date: date ?? new Date() });
};

/**
 * Notifies the visit's host of a check-in/check-out event. Silently
 * skips if there's no way to reach them (no snapshot email, no linked
 * dashboard user) rather than failing the check-in/out itself.
 */
const notifyHost = async (
   attendance: AttendanceDetail,
   type: NotificationType,
   message: string,
) => {
   const { visit } = attendance.visitParticipant;

   const recipientEmail = visit.hostEmailSnapshot ?? visit.hostEmployee?.email;
   const recipientUserId = visit.hostEmployee?.user?.id;

   if (!recipientEmail && !recipientUserId) {
      return;
   }

   await dispatchNotification({
      type,
      channel: 'EMAIL',
      subject: 'Visitor status update',
      message,
      visitId: visit.id,
      recipientUserId,
      recipientEmail,
   });
};

/**
 * Checks a visitor in for a given scheduled day.
 *
 * Ideally the SCHEDULED attendance row already exists — pre-generated
 * for every participant/schedule pairing when the visit was approved —
 * but Visits' approveVisit doesn't create those rows yet. This falls
 * back to creating the row on the spot so check-in still works end to
 * end; once that generation step is wired in on the Visits side, the
 * fallback simply becomes a no-op safety net.
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

   if (participant.visit.status !== 'APPROVED') {
      throw new BadRequestError('Visit must be APPROVED before check-in');
   }

   const schedule = await prisma.visitSchedule.findUnique({
      where: { id: input.visitScheduleId },
   });

   if (!schedule || schedule.visitId !== participant.visitId) {
      throw new NotFoundError('Scheduled date not found for this visit');
   }

   let attendance = await prisma.visitAttendance.findUnique({
      where: {
         visitParticipantId_visitScheduleId: {
            visitParticipantId: input.visitParticipantId,
            visitScheduleId: input.visitScheduleId,
         },
      },
   });

   if (!attendance) {
      attendance = await prisma.visitAttendance.create({
         data: {
            visitParticipantId: input.visitParticipantId,
            visitScheduleId: input.visitScheduleId,
         },
      });
   }

   assertTransition(attendance.status, ['SCHEDULED']);

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

   await notifyHost(
      updated,
      'VISITOR_CHECKED_IN',
      `${updated.visitParticipant.visitor.firstName} ${updated.visitParticipant.visitor.lastName} has checked in for visit ${updated.visitParticipant.visit.visitCode}.`,
   );

   return updated;
};

/**
 * Checks a visitor out, releases their badge if one was assigned, and
 * completes the parent Visit once every participant/schedule pairing
 * has left the SCHEDULED/CHECKED_IN state.
 */
export const checkOutVisitor = async (
   id: number,
   actorId: number,
): Promise<AttendanceDetail> => {
   const attendance = await prisma.visitAttendance.findUnique({
      where: { id },
      include: { visitParticipant: true },
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

   await notifyHost(
      updated,
      'VISITOR_CHECKED_OUT',
      `${updated.visitParticipant.visitor.firstName} ${updated.visitParticipant.visitor.lastName} has checked out from visit ${updated.visitParticipant.visit.visitCode}.`,
   );

   await completeVisitIfFullyCheckedOut(
      attendance.visitParticipant.visitId,
      actorId,
   );

   return updated;
};

/**
 * NOTE: writes directly into Visit rather than going through a
 * function exposed by the Visits module, since Visits doesn't
 * currently export a "complete" helper. Worth revisiting by adding one
 * there and calling it from here instead, to keep Visit's own status
 * transitions in one place.
 */
const completeVisitIfFullyCheckedOut = async (
   visitId: number,
   actorId: number,
) => {
   const outstanding = await prisma.visitAttendance.count({
      where: {
         visitParticipant: { visitId },
         status: { in: ['SCHEDULED', 'CHECKED_IN'] },
      },
   });

   if (outstanding > 0) {
      return;
   }

   const visit = await prisma.visit.findUnique({ where: { id: visitId } });

   if (!visit || visit.status !== 'APPROVED') {
      return;
   }

   await prisma.visit.update({
      where: { id: visitId },
      data: {
         status: 'COMPLETED',
         statusHistory: {
            create: {
               fromStatus: 'APPROVED',
               toStatus: 'COMPLETED',
               changedById: actorId,
            },
         },
      },
   });
};

/** Marks a still-SCHEDULED slot as unattended — typically an end-of-day sweep. */
export const markNoShow = async (id: number): Promise<AttendanceDetail> => {
   const attendance = await getAttendanceById(id);

   assertTransition(attendance.status, ['SCHEDULED']);

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
      id: String(attendance.visitParticipant.visitor.id),
      firstName: attendance.visitParticipant.visitor.firstName,
      lastName: attendance.visitParticipant.visitor.lastName,
      phone: attendance.visitParticipant.visitor.phone,
   },
   visit: {
      id: String(attendance.visitParticipant.visit.id),
      visitCode: attendance.visitParticipant.visit.visitCode,
      status: attendance.visitParticipant.visit.status,
   },
   schedule: {
      id: String(attendance.visitSchedule.id),
      date: attendance.visitSchedule.date,
      expectedStartTime:
         attendance.visitSchedule.expectedStartTime ?? undefined,
      expectedEndTime: attendance.visitSchedule.expectedEndTime ?? undefined,
   },
   badge: attendance.badge
      ? {
           id: String(attendance.badge.id),
           badgeNumber: attendance.badge.badgeNumber,
           status: attendance.badge.status,
        }
      : undefined,
   checkedInBy: attendance.checkedInBy?.employee
      ? {
           firstName: attendance.checkedInBy.employee.firstName,
           lastName: attendance.checkedInBy.employee.lastName,
        }
      : undefined,
   checkedOutBy: attendance.checkedOutBy?.employee
      ? {
           firstName: attendance.checkedOutBy.employee.firstName,
           lastName: attendance.checkedOutBy.employee.lastName,
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
   visitorName: `${attendance.visitParticipant.visitor.firstName} ${attendance.visitParticipant.visitor.lastName}`,
   visitorPhone: attendance.visitParticipant.visitor.phone,
   visit: {
      id: String(attendance.visitParticipant.visit.id),
      visitCode: attendance.visitParticipant.visit.visitCode,
      status: attendance.visitParticipant.visit.status,
   },
   scheduleDate: attendance.visitSchedule.date,
   badgeNumber: attendance.badge?.badgeNumber,
});
