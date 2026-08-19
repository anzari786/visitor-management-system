import {
   Prisma,
   type RoleName,
   type VisitDurationType,
   type VisitPurpose,
   type VisitorGroupType,
   type VisitStatus,
} from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import {
   BadRequestError,
   ForbiddenError,
   NotFoundError,
} from '../../lib/errors.js';
import { getSkipTake, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationParams } from '../../utils/pagination.js';
import { generateVisitCode } from '../../utils/visit-code.js';
import { generateQrToken } from '../../services/qr.service.js';
import {
   notifyHostInvitation,
   notifyVisitApproved,
   notifyVisitCancelled,
   notifyVisitRejected,
   notifyVisitRescheduled,
   notifyVisitSubmitted,
} from '../../services/visit-notifications.service.js';
import { findOrCreateVisitor } from '../visitors/visitor.service.js';
import { visitDetailSelect, visitSummarySelect } from './visit.types.js';
import type {
   ApproveVisitInput,
   CreateVisitInput,
   CreateVisitMeta,
   RescheduleVisitInput,
   ScheduleDateInput,
   VisitDetail,
   VisitSummary,
} from './visit.types.js';

const HOST_DECISION_ROLES: RoleName[] = ['MANAGER', 'ADMIN', 'RECEPTION'];
const HOST_MODIFY_ROLES: RoleName[] = [
   'MANAGER',
   'ADMIN',
   'RECEPTION',
   'GUARD',
];

const MAX_CODE_GENERATION_ATTEMPTS = 5;

const PURPOSE_VALUES = new Set<VisitPurpose>([
   'MEETING',
   'INTERVIEW',
   'DELIVERY',
   'OFFICIAL_VISIT',
   'MAINTENANCE',
   'OTHER',
]);

const toVisitPurpose = (purpose: string): VisitPurpose => {
   const normalized = purpose.trim().toUpperCase().replace(/\s+/g, '_');
   if (PURPOSE_VALUES.has(normalized as VisitPurpose)) {
      return normalized as VisitPurpose;
   }
   return 'OTHER';
};

const formatHhMm = (value?: Date): string => {
   if (!value) return '09:00';
   const hours = String(value.getHours()).padStart(2, '0');
   const minutes = String(value.getMinutes()).padStart(2, '0');
   return `${hours}:${minutes}`;
};

const uniqueDates = (scheduleDates: ScheduleDateInput[]): Date[] => {
   const seen = new Set<string>();
   const dates: Date[] = [];

   for (const schedule of scheduleDates) {
      const day = new Date(schedule.date);
      day.setHours(0, 0, 0, 0);
      const key = day.toISOString().slice(0, 10);
      if (!seen.has(key)) {
         seen.add(key);
         dates.push(day);
      }
   }

   return dates.sort((a, b) => a.getTime() - b.getTime());
};

const createVisitWithUniqueCode = async (
   data: Omit<Prisma.VisitUncheckedCreateInput, 'visitCode' | 'qrToken'> & {
      days?: { create: Array<{ date: Date }> };
      participants?: { create: Array<{ visitorId: number }> };
      statusHistory?: Prisma.VisitStatusHistoryUncheckedCreateNestedManyWithoutVisitInput;
   },
): Promise<VisitDetail> => {
   for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
      try {
         return await prisma.visit.create({
            data: {
               ...data,
               visitCode: generateVisitCode(),
               qrToken: generateQrToken(),
            },
            select: visitDetailSelect,
         });
      } catch (error) {
         const isCodeCollision =
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002';
         const isLastAttempt = attempt === MAX_CODE_GENERATION_ATTEMPTS - 1;

         if (!isCodeCollision || isLastAttempt) {
            throw error;
         }
      }
   }

   throw new Error('Failed to generate a unique visit code');
};

const assertTransition = (current: VisitStatus, allowed: VisitStatus[]) => {
   if (!allowed.includes(current)) {
      throw new BadRequestError(
         `Visit cannot be changed from its current status (${current})`,
      );
   }
};

/**
 * Hosts are Employees (optionally linked to a User). Staff roles can act on
 * any visit; a linked host user may only act on their own visits.
 */
export const assertVisitActorAccess = async (
   visitHostEmployeeId: number | null,
   actorId: number,
   actorRoles: RoleName[],
   allowedStaffRoles: RoleName[],
) => {
   if (actorRoles.some((role) => allowedStaffRoles.includes(role))) {
      return;
   }

   const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { employeeId: true },
   });

   if (
      actor?.employeeId &&
      visitHostEmployeeId &&
      actor.employeeId === visitHostEmployeeId
   ) {
      return;
   }

   throw new ForbiddenError(
      'You do not have permission to manage this visit',
   );
};

const seedExpectedAttendances = async (visitId: number) => {
   const [participants, days] = await Promise.all([
      prisma.visitParticipant.findMany({
         where: { visitId },
         select: { id: true },
      }),
      prisma.visitDay.findMany({
         where: { visitId },
         select: { id: true },
      }),
   ]);

   if (!participants.length || !days.length) {
      return;
   }

   await prisma.visitAttendance.createMany({
      data: participants.flatMap((participant) =>
         days.map((day) => ({
            participantId: participant.id,
            visitDayId: day.id,
            status: 'EXPECTED' as const,
         })),
      ),
      skipDuplicates: true,
   });
};

/**
 * Shared core for public request, walk-in, and host-invitation paths.
 */
export const createVisit = async (
   input: CreateVisitInput,
   meta: CreateVisitMeta,
): Promise<VisitDetail> => {
   const hostEmployee = await prisma.employee.findUnique({
      where: { id: input.hostEmployeeId },
   });

   if (!hostEmployee || !hostEmployee.isActive) {
      throw new NotFoundError('Host employee not found');
   }

   const visitorRecords = await Promise.all(
      input.visitors.map((visitor) => findOrCreateVisitor(visitor)),
   );

   const days = uniqueDates(input.scheduleDates);
   if (!days.length) {
      throw new BadRequestError('At least one visit date is required');
   }

   const firstSchedule = input.scheduleDates[0];
   const isHostInvitation = meta.source === 'HOST_INVITATION';
   const initialStatus: VisitStatus = isHostInvitation
      ? 'APPROVED'
      : 'PENDING_APPROVAL';

   const visit = await createVisitWithUniqueCode({
      source: meta.source,
      groupType: input.groupType,
      durationType: input.durationType,
      status: initialStatus,
      purpose: toVisitPurpose(String(input.purpose)),
      hostEmployeeId: hostEmployee.id,
      hostNameSnapshot: `${hostEmployee.firstName} ${hostEmployee.lastName}`,
      hostEmailSnapshot: hostEmployee.email,
      departmentNameSnapshot: hostEmployee.departmentName,
      departmentCodeSnapshot: hostEmployee.departmentCode,
      floor: input.floor,
      room: input.room,
      startDate: days[0],
      endDate: days[days.length - 1],
      startTime: formatHhMm(firstSchedule?.expectedStartTime),
      endTime: formatHhMm(firstSchedule?.expectedEndTime) || '17:00',
      expectedVisitorCount: visitorRecords.length,
      createdById: meta.createdById,
      ...(isHostInvitation && {
         decidedById: meta.createdById,
         decisionAt: new Date(),
      }),
      participants: {
         create: visitorRecords.map((visitor) => ({ visitorId: visitor.id })),
      },
      days: {
         create: days.map((date) => ({ date })),
      },
      statusHistory: {
         create: [
            {
               fromStatus: null,
               toStatus: initialStatus,
               changedById: meta.createdById,
            },
         ],
      },
   });

   if (isHostInvitation) {
      await seedExpectedAttendances(visit.id);
      await notifyHostInvitation(visit);
   } else {
      await notifyVisitSubmitted(visit);
   }

   return visit;
};

interface ListVisitsFilters extends PaginationParams {
   status?: VisitStatus;
   hostEmployeeId?: number;
   durationType?: VisitDurationType;
   groupType?: VisitorGroupType;
   search?: string;
   dateFrom?: Date;
   dateTo?: Date;
}

export const listVisits = async (filters: ListVisitsFilters) => {
   const where: Prisma.VisitWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.hostEmployeeId && { hostEmployeeId: filters.hostEmployeeId }),
      ...(filters.durationType && { durationType: filters.durationType }),
      ...(filters.groupType && { groupType: filters.groupType }),
      ...(filters.search && {
         OR: [
            { visitCode: { contains: filters.search } },
            {
               participants: {
                  some: {
                     visitor: {
                        OR: [
                           { firstName: { contains: filters.search } },
                           { lastName: { contains: filters.search } },
                           { phone: { contains: filters.search } },
                           { email: { contains: filters.search } },
                        ],
                     },
                  },
               },
            },
         ],
      }),
      ...((filters.dateFrom || filters.dateTo) && {
         days: {
            some: {
               date: {
                  ...(filters.dateFrom && { gte: filters.dateFrom }),
                  ...(filters.dateTo && { lte: filters.dateTo }),
               },
            },
         },
      }),
   };

   const [visits, total] = await Promise.all([
      prisma.visit.findMany({
         where,
         select: visitSummarySelect,
         orderBy: { createdAt: 'desc' },
         ...getSkipTake(filters),
      }),
      prisma.visit.count({ where }),
   ]);

   return {
      visits,
      meta: buildPaginationMeta(filters, total),
   };
};

export const getVisitById = async (id: number): Promise<VisitDetail> => {
   const visit = await prisma.visit.findUnique({
      where: { id },
      select: visitDetailSelect,
   });

   if (!visit) {
      throw new NotFoundError('Visit not found');
   }

   return visit;
};

export const approveVisit = async (
   id: number,
   decidedById: number,
   actorRoles: RoleName[],
   input: ApproveVisitInput,
): Promise<VisitDetail> => {
   const visit = await getVisitById(id);

   await assertVisitActorAccess(
      visit.hostEmployee?.id ?? null,
      decidedById,
      actorRoles,
      HOST_DECISION_ROLES,
   );

   assertTransition(visit.status, ['PENDING_APPROVAL', 'RESCHEDULED']);

   const updated = await prisma.visit.update({
      where: { id },
      data: {
         status: 'APPROVED',
         floor: input.floor,
         room: input.room,
         decidedById,
         decisionAt: new Date(),
         decisionNote: input.note,
         statusHistory: {
            create: {
               fromStatus: visit.status,
               toStatus: 'APPROVED',
               changedById: decidedById,
               note: input.note,
            },
         },
      },
      select: visitDetailSelect,
   });

   await seedExpectedAttendances(updated.id);
   await notifyVisitApproved(updated);

   return updated;
};

export const rejectVisit = async (
   id: number,
   decidedById: number,
   actorRoles: RoleName[],
   note?: string,
): Promise<VisitDetail> => {
   const visit = await getVisitById(id);

   await assertVisitActorAccess(
      visit.hostEmployee?.id ?? null,
      decidedById,
      actorRoles,
      HOST_DECISION_ROLES,
   );

   assertTransition(visit.status, ['PENDING_APPROVAL', 'RESCHEDULED']);

   const updated = await prisma.visit.update({
      where: { id },
      data: {
         status: 'REJECTED',
         decidedById,
         decisionAt: new Date(),
         decisionNote: note,
         statusHistory: {
            create: {
               fromStatus: visit.status,
               toStatus: 'REJECTED',
               changedById: decidedById,
               note,
            },
         },
      },
      select: visitDetailSelect,
   });

   await notifyVisitRejected(updated);

   return updated;
};

/**
 * Updates schedule/location. Rescheduled visits are treated as approved
 * with the new details (per VMS workflow).
 */
export const rescheduleVisit = async (
   id: number,
   input: RescheduleVisitInput,
   actorId: number,
   actorRoles: RoleName[],
): Promise<VisitDetail> => {
   const visit = await getVisitById(id);

   await assertVisitActorAccess(
      visit.hostEmployee?.id ?? null,
      actorId,
      actorRoles,
      HOST_MODIFY_ROLES,
   );

   assertTransition(visit.status, [
      'PENDING_APPROVAL',
      'APPROVED',
      'RESCHEDULED',
   ]);

   const days = uniqueDates(input.scheduleDates);
   if (!days.length) {
      throw new BadRequestError('At least one visit date is required');
   }

   const firstSchedule = input.scheduleDates[0];

   const updated = await prisma.visit.update({
      where: { id },
      data: {
         status: 'RESCHEDULED',
         startDate: days[0],
         endDate: days[days.length - 1],
         startTime: formatHhMm(firstSchedule?.expectedStartTime),
         endTime: formatHhMm(firstSchedule?.expectedEndTime) || visit.endTime,
         ...(input.floor !== undefined && { floor: input.floor }),
         ...(input.room !== undefined && { room: input.room }),
         decisionNote: input.note,
         days: {
            deleteMany: {},
            create: days.map((date) => ({ date })),
         },
         statusHistory: {
            create: {
               fromStatus: visit.status,
               toStatus: 'RESCHEDULED',
               changedById: actorId,
               note: input.note,
            },
         },
      },
      select: visitDetailSelect,
   });

   await notifyVisitRescheduled(updated);

   if (updated.status === 'RESCHEDULED' || updated.status === 'APPROVED') {
      await seedExpectedAttendances(updated.id);
   }

   return updated;
};

export const cancelVisit = async (
   id: number,
   actorId: number,
   actorRoles: RoleName[],
   note?: string,
): Promise<VisitDetail> => {
   const visit = await getVisitById(id);

   await assertVisitActorAccess(
      visit.hostEmployee?.id ?? null,
      actorId,
      actorRoles,
      HOST_MODIFY_ROLES,
   );

   assertTransition(visit.status, [
      'PENDING_APPROVAL',
      'APPROVED',
      'RESCHEDULED',
   ]);

   const updated = await prisma.visit.update({
      where: { id },
      data: {
         status: 'CANCELLED',
         statusHistory: {
            create: {
               fromStatus: visit.status,
               toStatus: 'CANCELLED',
               changedById: actorId,
               note,
            },
         },
      },
      select: visitDetailSelect,
   });

   await notifyVisitCancelled(updated);

   return updated;
};

export const formatVisitDetail = (visit: VisitDetail) => ({
   id: String(visit.id),
   visitCode: visit.visitCode,
   qrToken: visit.qrToken,
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
   host: visit.hostEmployee
      ? {
           id: String(visit.hostEmployee.id),
           firstName: visit.hostEmployee.firstName,
           lastName: visit.hostEmployee.lastName,
           email: visit.hostEmployee.email,
           departmentName: visit.hostEmployee.departmentName,
        }
      : undefined,
   hostEmailSnapshot: visit.hostEmailSnapshot ?? undefined,
   departmentNameSnapshot: visit.departmentNameSnapshot ?? undefined,
   departmentCodeSnapshot: visit.departmentCodeSnapshot ?? undefined,
   decisionAt: visit.decisionAt ?? undefined,
   decisionNote: visit.decisionNote ?? undefined,
   participants: visit.participants.map((participant) => ({
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
   })),
   days: visit.days.map((day) => ({
      id: String(day.id),
      date: day.date,
   })),
   statusHistory: visit.statusHistory.map((entry) => ({
      id: String(entry.id),
      fromStatus: entry.fromStatus ?? undefined,
      toStatus: entry.toStatus,
      note: entry.note ?? undefined,
      createdAt: entry.createdAt,
      changedBy: entry.changedBy
         ? {
              firstName: entry.changedBy.firstName,
              lastName: entry.changedBy.lastName,
           }
         : undefined,
   })),
   createdAt: visit.createdAt,
   updatedAt: visit.updatedAt,
});

export const formatVisitSummary = (visit: VisitSummary) => ({
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
   host: visit.hostEmployee
      ? {
           id: String(visit.hostEmployee.id),
           firstName: visit.hostEmployee.firstName,
           lastName: visit.hostEmployee.lastName,
           departmentName: visit.hostEmployee.departmentName,
        }
      : undefined,
   visitorNames: visit.participants.map(
      (participant) =>
         `${participant.visitor.firstName} ${participant.visitor.lastName}`,
   ),
   scheduleDates: visit.days.map((day) => day.date),
   createdAt: visit.createdAt,
});
