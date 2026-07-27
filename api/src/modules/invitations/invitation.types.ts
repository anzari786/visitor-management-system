import type {
   Prisma,
   VisitDurationType,
   VisitorGroupType,
} from '../../generated/prisma/client.js';

/** Full record shape for the invitation detail view. */
export const invitationDetailSelect = {
   id: true,
   invitationCode: true,
   qrToken: true,
   groupType: true,
   durationType: true,
   status: true,
   expectedVisitorCount: true,
   organization: true,
   purpose: true,
   departmentNameSnapshot: true,
   departmentCodeSnapshot: true,
   plannedStartDate: true,
   plannedEndDate: true,
   sentAt: true,
   arrivedAt: true,
   decisionNote: true,
   createdAt: true,
   updatedAt: true,
   hostEmployee: {
      select: {
         id: true,
         firstName: true,
         lastName: true,
         email: true,
         departmentName: true,
      },
   },
   decidedBy: {
      select: {
         id: true,
         employee: {
            select: { firstName: true, lastName: true },
         },
      },
   },
   visit: {
      select: {
         id: true,
         visitCode: true,
         status: true,
      },
   },
   statusHistory: {
      select: {
         id: true,
         fromStatus: true,
         toStatus: true,
         note: true,
         createdAt: true,
         changedBy: {
            select: {
               id: true,
               employee: {
                  select: { firstName: true, lastName: true },
               },
            },
         },
      },
      orderBy: { createdAt: 'desc' },
   },
} satisfies Prisma.InvitationSelect;

export type InvitationDetail = Prisma.InvitationGetPayload<{
   select: typeof invitationDetailSelect;
}>;

/** Lighter shape for the invitation list/search view. */
export const invitationSummarySelect = {
   id: true,
   invitationCode: true,
   groupType: true,
   durationType: true,
   status: true,
   expectedVisitorCount: true,
   organization: true,
   plannedStartDate: true,
   plannedEndDate: true,
   createdAt: true,
   hostEmployee: {
      select: {
         id: true,
         firstName: true,
         lastName: true,
         departmentName: true,
      },
   },
} satisfies Prisma.InvitationSelect;

export type InvitationSummary = Prisma.InvitationGetPayload<{
   select: typeof invitationSummarySelect;
}>;

export interface CreateInvitationInput {
   groupType: VisitorGroupType;
   durationType: VisitDurationType;
   purpose: string;
   hostEmployeeId: number;
   expectedVisitorCount: number;
   organization?: string;
   plannedStartDate: Date;
   plannedEndDate: Date;
}

export interface CreateInvitationMeta {
   createdById: number;
}
