import {
   Prisma,
   type InvitationStatus,
   type VisitDurationType,
   type VisitorGroupType,
} from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import { getSkipTake, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationParams } from '../../utils/pagination.js';
import { generateInvitationCode } from '../../utils/visit-code.js';
import { generateQrToken } from '../../services/qr.service.js';
import { createVisit } from '../visits/visit.service.js';
import type {
   ScheduleDateInput,
   VisitorInputForVisit,
} from '../visits/visit.types.js';
import {
   invitationDetailSelect,
   invitationSummarySelect,
} from './invitation.types.js';
import type {
   CreateInvitationInput,
   CreateInvitationMeta,
   InvitationDetail,
   InvitationSummary,
} from './invitation.types.js';

const MAX_CODE_GENERATION_ATTEMPTS = 5;

/**
 * Creates the Invitation row with a fresh invitationCode/qrToken pair,
 * retrying on the rare chance of a collision against the unique
 * constraints — mirrors the same pattern used for Visit creation.
 */
const createInvitationWithUniqueCode = async (
   data: Omit<
      Prisma.InvitationUncheckedCreateInput,
      'invitationCode' | 'qrToken'
   >,
): Promise<InvitationDetail> => {
   for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
      try {
         return await prisma.invitation.create({
            data: {
               ...data,
               invitationCode: generateInvitationCode(),
               qrToken: generateQrToken(),
            },
            select: invitationDetailSelect,
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
   throw new Error('Failed to generate a unique invitation code');
};

const assertTransition = (
   current: InvitationStatus,
   allowed: InvitationStatus[],
) => {
   if (!allowed.includes(current)) {
      throw new BadRequestError(
         `Invitation cannot be changed from its current status (${current})`,
      );
   }
};

/**
 * A host (or reception/admin on a host's behalf) generates an
 * invitation ahead of the visitor's arrival. No visitor identity exists
 * yet at this point — just an expected headcount — the invitationCode/
 * qrToken are what gets shared with the invitee so they can be looked
 * up on arrival.
 */
export const createInvitation = async (
   input: CreateInvitationInput,
   meta: CreateInvitationMeta,
): Promise<InvitationDetail> => {
   const hostEmployee = await prisma.employee.findUnique({
      where: { id: input.hostEmployeeId },
   });

   if (!hostEmployee || !hostEmployee.isActive) {
      throw new NotFoundError('Host employee not found');
   }

   return createInvitationWithUniqueCode({
      groupType: input.groupType,
      durationType: input.durationType,
      status: 'SENT',
      expectedVisitorCount: input.expectedVisitorCount,
      organization: input.organization,
      purpose: input.purpose,
      hostEmployeeId: hostEmployee.id,
      departmentNameSnapshot: hostEmployee.departmentName,
      departmentCodeSnapshot: hostEmployee.departmentCode,
      plannedStartDate: input.plannedStartDate,
      plannedEndDate: input.plannedEndDate,
      createdById: meta.createdById,
      sentAt: new Date(),
      statusHistory: {
         create: [
            {
               fromStatus: null,
               toStatus: 'SENT',
               changedById: meta.createdById,
            },
         ],
      },
   });
};

interface ListInvitationsFilters extends PaginationParams {
   status?: InvitationStatus;
   hostEmployeeId?: number;
   durationType?: VisitDurationType;
   groupType?: VisitorGroupType;
   search?: string;
   dateFrom?: Date;
   dateTo?: Date;
}

export const listInvitations = async (filters: ListInvitationsFilters) => {
   const where: Prisma.InvitationWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.hostEmployeeId && { hostEmployeeId: filters.hostEmployeeId }),
      ...(filters.durationType && { durationType: filters.durationType }),
      ...(filters.groupType && { groupType: filters.groupType }),
      ...(filters.search && {
         invitationCode: { contains: filters.search },
      }),
      ...((filters.dateFrom || filters.dateTo) && {
         plannedStartDate: {
            ...(filters.dateFrom && { gte: filters.dateFrom }),
            ...(filters.dateTo && { lte: filters.dateTo }),
         },
      }),
   };

   const [invitations, total] = await Promise.all([
      prisma.invitation.findMany({
         where,
         select: invitationSummarySelect,
         orderBy: { createdAt: 'desc' },
         ...getSkipTake(filters),
      }),
      prisma.invitation.count({ where }),
   ]);

   return {
      invitations,
      meta: buildPaginationMeta(filters, total),
   };
};

export const getInvitationById = async (
   id: number,
): Promise<InvitationDetail> => {
   const invitation = await prisma.invitation.findUnique({
      where: { id },
      select: invitationDetailSelect,
   });

   if (!invitation) {
      throw new NotFoundError('Invitation not found');
   }

   return invitation;
};

/**
 * Marks that the invited guest has physically shown up. This does not
 * change status — SENT covers both "not yet arrived" and "arrived,
 * awaiting a decision" — it only stamps arrivedAt so reception can see
 * who's actually present versus who never showed.
 */
export const recordInvitationArrival = async (
   id: number,
): Promise<InvitationDetail> => {
   const invitation = await getInvitationById(id);

   assertTransition(invitation.status, ['SENT']);

   if (invitation.arrivedAt) {
      throw new BadRequestError(
         'Arrival has already been recorded for this invitation',
      );
   }

   return prisma.invitation.update({
      where: { id },
      data: { arrivedAt: new Date() },
      select: invitationDetailSelect,
   });
};

/**
 * Reception/host declines to admit the arrived guest — e.g. identity
 * doesn't match, or the visit no longer needs to happen.
 */
export const rejectInvitation = async (
   id: number,
   decidedById: number,
   note?: string,
): Promise<InvitationDetail> => {
   const invitation = await getInvitationById(id);

   assertTransition(invitation.status, ['SENT']);

   return prisma.invitation.update({
      where: { id },
      data: {
         status: 'REJECTED',
         decidedById,
         decisionNote: note,
         statusHistory: {
            create: {
               fromStatus: invitation.status,
               toStatus: 'REJECTED',
               changedById: decidedById,
               note,
            },
         },
      },
      select: invitationDetailSelect,
   });
};

/** Host or admin withdraws an invitation before it's ever used. */
export const cancelInvitation = async (
   id: number,
   actorId: number,
   note?: string,
): Promise<InvitationDetail> => {
   const invitation = await getInvitationById(id);

   assertTransition(invitation.status, ['SENT']);

   return prisma.invitation.update({
      where: { id },
      data: {
         status: 'CANCELLED',
         statusHistory: {
            create: {
               fromStatus: invitation.status,
               toStatus: 'CANCELLED',
               changedById: actorId,
               note,
            },
         },
      },
      select: invitationDetailSelect,
   });
};

/**
 * Approves the arrived guest's actual details and converts the
 * invitation into a real Visit — the invitation only ever carried an
 * expected headcount, so the visitor records collected here are what
 * becomes the Visit's participant list.
 *
 * This is three separate writes (visit create, visit-invitation link,
 * invitation status update) rather than one atomic transaction, since
 * Visit creation is owned by the Visits module's own service function.
 * A failure between steps would need manual reconciliation — an
 * acceptable trade-off for now, but worth revisiting if this becomes a
 * high-volume path.
 *
 * TODO: the resulting Visit's initial status is hardcoded to
 * PENDING_APPROVAL. Once the Settings module exists, this should honor
 * the SystemSetting that lets host invitations bypass approval.
 */
export const convertInvitation = async (
   id: number,
   visitors: VisitorInputForVisit[],
   scheduleDates: ScheduleDateInput[],
   actorId: number,
   note?: string,
): Promise<InvitationDetail> => {
   const invitation = await prisma.invitation.findUnique({ where: { id } });

   if (!invitation) {
      throw new NotFoundError('Invitation not found');
   }

   assertTransition(invitation.status, ['SENT']);

   if (!invitation.arrivedAt) {
      throw new BadRequestError(
         'Visitor arrival must be recorded before the invitation can be converted',
      );
   }

   const visit = await createVisit(
      {
         groupType: invitation.groupType,
         durationType: invitation.durationType,
         purpose: invitation.purpose,
         hostEmployeeId: invitation.hostEmployeeId,
         visitors,
         scheduleDates,
      },
      { isAssisted: true, createdById: actorId },
   );

   await prisma.visit.update({
      where: { id: visit.id },
      data: { invitationId: invitation.id },
   });

   return prisma.invitation.update({
      where: { id },
      data: {
         status: 'CONVERTED',
         decidedById: actorId,
         decisionNote: note,
         statusHistory: {
            create: [
               {
                  fromStatus: invitation.status,
                  toStatus: 'APPROVED',
                  changedById: actorId,
                  note,
               },
               {
                  fromStatus: 'APPROVED',
                  toStatus: 'CONVERTED',
                  changedById: actorId,
               },
            ],
         },
      },
      select: invitationDetailSelect,
   });
};

export const formatInvitationDetail = (invitation: InvitationDetail) => ({
   id: String(invitation.id),
   invitationCode: invitation.invitationCode,
   qrToken: invitation.qrToken,
   groupType: invitation.groupType,
   durationType: invitation.durationType,
   status: invitation.status,
   expectedVisitorCount: invitation.expectedVisitorCount,
   organization: invitation.organization ?? undefined,
   purpose: invitation.purpose,
   departmentNameSnapshot: invitation.departmentNameSnapshot ?? undefined,
   departmentCodeSnapshot: invitation.departmentCodeSnapshot ?? undefined,
   plannedStartDate: invitation.plannedStartDate,
   plannedEndDate: invitation.plannedEndDate,
   sentAt: invitation.sentAt ?? undefined,
   arrivedAt: invitation.arrivedAt ?? undefined,
   decisionNote: invitation.decisionNote ?? undefined,
   host: invitation.hostEmployee
      ? {
           id: String(invitation.hostEmployee.id),
           firstName: invitation.hostEmployee.firstName,
           lastName: invitation.hostEmployee.lastName,
           email: invitation.hostEmployee.email,
           departmentName: invitation.hostEmployee.departmentName,
        }
      : undefined,
   decidedBy: invitation.decidedBy?.employee
      ? {
           firstName: invitation.decidedBy.employee.firstName,
           lastName: invitation.decidedBy.employee.lastName,
        }
      : undefined,
   visit: invitation.visit
      ? {
           id: String(invitation.visit.id),
           visitCode: invitation.visit.visitCode,
           status: invitation.visit.status,
        }
      : undefined,
   statusHistory: invitation.statusHistory.map((entry) => ({
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
   createdAt: invitation.createdAt,
   updatedAt: invitation.updatedAt,
});

export const formatInvitationSummary = (invitation: InvitationSummary) => ({
   id: String(invitation.id),
   invitationCode: invitation.invitationCode,
   groupType: invitation.groupType,
   durationType: invitation.durationType,
   status: invitation.status,
   expectedVisitorCount: invitation.expectedVisitorCount,
   organization: invitation.organization ?? undefined,
   plannedStartDate: invitation.plannedStartDate,
   plannedEndDate: invitation.plannedEndDate,
   host: invitation.hostEmployee
      ? {
           id: String(invitation.hostEmployee.id),
           firstName: invitation.hostEmployee.firstName,
           lastName: invitation.hostEmployee.lastName,
           departmentName: invitation.hostEmployee.departmentName,
        }
      : undefined,
   createdAt: invitation.createdAt,
});
