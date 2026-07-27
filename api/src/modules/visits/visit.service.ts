import {
   Prisma,
   type VisitDurationType,
   type VisitorGroupType,
   type VisitStatus,
} from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import { getSkipTake, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationParams } from '../../utils/pagination.js';
import { generateVisitCode } from '../../utils/visit-code.js';
import { generateQrToken } from '../../services/qr.service.js';
import { findOrCreateVisitor } from '../visitors/visitor.service.js';
import { visitDetailSelect, visitSummarySelect } from './visit.types.js';
import type {
   CreateVisitInput,
   CreateVisitMeta,
   ScheduleDateInput,
   VisitDetail,
   VisitSummary,
} from './visit.types.js';

const MAX_CODE_GENERATION_ATTEMPTS = 5;

/**
 * Creates the Visit row with a fresh visitCode/qrToken pair, retrying on
 * the rare chance of a collision against the unique constraints.
 */
const createVisitWithUniqueCode = async (
   data: Omit<Prisma.VisitUncheckedCreateInput, 'visitCode' | 'qrToken'>,
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

   // Unreachable — the loop above always returns or throws.
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
 * Shared core for both the public visitor-request and reception
 * walk-in paths — they differ only in isAssisted/createdById, everything
 * else about building the Visit aggregate is identical.
 *
 * Department/host details are snapshotted onto the visit at creation
 * time so historical reporting survives later HR re-organizations.
 *
 * NOTE: this does not pre-generate VisitAttendance rows for each
 * participant/schedule pairing — that belongs to the Attendance module,
 * which should create them once a visit reaches APPROVED.
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

   // Visitors are deduplicated on their ID document by the visitors
   // module — reused here rather than re-implementing that lookup.
   const visitorRecords = await Promise.all(
      input.visitors.map((visitor) => findOrCreateVisitor(visitor)),
   );

   return createVisitWithUniqueCode({
      groupType: input.groupType,
      durationType: input.durationType,
      status: 'PENDING_APPROVAL',
      purpose: input.purpose,
      hostEmployeeId: hostEmployee.id,
      hostEmailSnapshot: hostEmployee.email,
      departmentNameSnapshot: hostEmployee.departmentName,
      departmentCodeSnapshot: hostEmployee.departmentCode,
      isAssisted: meta.isAssisted,
      createdById: meta.createdById,
      participants: {
         create: visitorRecords.map((visitor) => ({ visitorId: visitor.id })),
      },
      schedules: {
         create: input.scheduleDates.map((schedule) => ({
            date: schedule.date,
            expectedStartTime: schedule.expectedStartTime,
            expectedEndTime: schedule.expectedEndTime,
         })),
      },
      statusHistory: {
         create: [
            {
               fromStatus: null,
               toStatus: 'PENDING_APPROVAL',
               changedById: meta.createdById,
            },
         ],
      },
   });
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
                        ],
                     },
                  },
               },
            },
         ],
      }),
      ...((filters.dateFrom || filters.dateTo) && {
         schedules: {
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
   note?: string,
): Promise<VisitDetail> => {
   const visit = await getVisitById(id);

   assertTransition(visit.status, ['PENDING_APPROVAL']);

   return prisma.visit.update({
      where: { id },
      data: {
         status: 'APPROVED',
         decidedById,
         decisionAt: new Date(),
         decisionNote: note,
         statusHistory: {
            create: {
               fromStatus: visit.status,
               toStatus: 'APPROVED',
               changedById: decidedById,
               note,
            },
         },
      },
      select: visitDetailSelect,
   });
};

export const rejectVisit = async (
   id: number,
   decidedById: number,
   note?: string,
): Promise<VisitDetail> => {
   const visit = await getVisitById(id);

   assertTransition(visit.status, ['PENDING_APPROVAL']);

   return prisma.visit.update({
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
};

/**
 * Replaces the visit's scheduled dates and logs the transition through
 * RESCHEDULED before landing back on PENDING_APPROVAL, per the workflow
 * spec — the host gets a fresh chance to approve the new dates.
 */
export const rescheduleVisit = async (
   id: number,
   scheduleDates: ScheduleDateInput[],
   actorId: number,
   note?: string,
): Promise<VisitDetail> => {
   const visit = await getVisitById(id);

   assertTransition(visit.status, ['PENDING_APPROVAL', 'APPROVED']);

   return prisma.visit.update({
      where: { id },
      data: {
         status: 'PENDING_APPROVAL',
         schedules: {
            deleteMany: {},
            create: scheduleDates.map((schedule) => ({
               date: schedule.date,
               expectedStartTime: schedule.expectedStartTime,
               expectedEndTime: schedule.expectedEndTime,
            })),
         },
         statusHistory: {
            create: [
               {
                  fromStatus: visit.status,
                  toStatus: 'RESCHEDULED',
                  changedById: actorId,
                  note,
               },
               {
                  fromStatus: 'RESCHEDULED',
                  toStatus: 'PENDING_APPROVAL',
                  changedById: actorId,
               },
            ],
         },
      },
      select: visitDetailSelect,
   });
};

export const cancelVisit = async (
   id: number,
   actorId: number,
   note?: string,
): Promise<VisitDetail> => {
   const visit = await getVisitById(id);

   assertTransition(visit.status, [
      'PENDING_APPROVAL',
      'APPROVED',
      'RESCHEDULED',
   ]);

   return prisma.visit.update({
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
};

export const formatVisitDetail = (visit: VisitDetail) => ({
   id: String(visit.id),
   visitCode: visit.visitCode,
   qrToken: visit.qrToken,
   groupType: visit.groupType,
   durationType: visit.durationType,
   status: visit.status,
   purpose: visit.purpose,
   isAssisted: visit.isAssisted,
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
   visitExpiresAt: visit.visitExpiresAt ?? undefined,
   participants: visit.participants.map((participant) => ({
      participantId: String(participant.id),
      visitor: {
         id: String(participant.visitor.id),
         firstName: participant.visitor.firstName,
         lastName: participant.visitor.lastName,
         phone: participant.visitor.phone,
         email: participant.visitor.email ?? undefined,
         organization: participant.visitor.organization ?? undefined,
         idType: participant.visitor.idType,
         idNumber: participant.visitor.idNumber,
      },
   })),
   schedules: visit.schedules.map((schedule) => ({
      id: String(schedule.id),
      date: schedule.date,
      expectedStartTime: schedule.expectedStartTime ?? undefined,
      expectedEndTime: schedule.expectedEndTime ?? undefined,
   })),
   statusHistory: visit.statusHistory.map((entry) => ({
      id: String(entry.id),
      fromStatus: entry.fromStatus ?? undefined,
      toStatus: entry.toStatus,
      note: entry.note ?? undefined,
      createdAt: entry.createdAt,
      changedBy: entry.changedBy?.employee
         ? {
              firstName: entry.changedBy.employee.firstName,
              lastName: entry.changedBy.employee.lastName,
           }
         : undefined,
   })),
   createdAt: visit.createdAt,
   updatedAt: visit.updatedAt,
});

export const formatVisitSummary = (visit: VisitSummary) => ({
   id: String(visit.id),
   visitCode: visit.visitCode,
   groupType: visit.groupType,
   durationType: visit.durationType,
   status: visit.status,
   purpose: visit.purpose,
   isAssisted: visit.isAssisted,
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
   scheduleDates: visit.schedules.map((schedule) => schedule.date),
   createdAt: visit.createdAt,
});
