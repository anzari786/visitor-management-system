import type {
   IdType,
   Prisma,
   VisitDurationType,
   VisitPurpose,
   VisitSource,
   VisitorGroupType,
} from '../../generated/prisma/client.js';

/** Full record shape for the visit detail view. */
export const visitDetailSelect = {
   id: true,
   visitCode: true,
   source: true,
   groupType: true,
   durationType: true,
   status: true,
   purpose: true,
   hostNameSnapshot: true,
   hostEmailSnapshot: true,
   departmentNameSnapshot: true,
   departmentCodeSnapshot: true,
   floor: true,
   room: true,
   startDate: true,
   endDate: true,
   startTime: true,
   endTime: true,
   expectedVisitorCount: true,
   organization: true,
   decisionAt: true,
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
         user: { select: { id: true } },
      },
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
   days: {
      select: {
         id: true,
         date: true,
      },
      orderBy: { date: 'asc' },
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
               firstName: true,
               lastName: true,
            },
         },
      },
      orderBy: { createdAt: 'desc' },
   },
   invitation: {
      select: {
         expiresAt: true,
         revokedAt: true,
         createdAt: true,
      },
   },
} satisfies Prisma.VisitSelect;

export type VisitDetail = Prisma.VisitGetPayload<{
   select: typeof visitDetailSelect;
}>;

/** Lighter shape for the visit list/search view. */
export const visitSummarySelect = {
   id: true,
   visitCode: true,
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
   createdAt: true,
   hostEmployee: {
      select: {
         id: true,
         firstName: true,
         lastName: true,
         departmentName: true,
      },
   },
   participants: {
      select: {
         visitor: {
            select: { firstName: true, lastName: true, phone: true },
         },
      },
   },
   days: {
      select: { date: true },
      orderBy: { date: 'asc' },
   },
} satisfies Prisma.VisitSelect;

export type VisitSummary = Prisma.VisitGetPayload<{
   select: typeof visitSummarySelect;
}>;

export interface VisitorInputForVisit {
   firstName: string;
   lastName: string;
   phone: string;
   email?: string;
   organization?: string;
   idType?: IdType;
   idNumber?: string;
}

export interface ScheduleDateInput {
   date: Date;
   expectedStartTime?: Date;
   expectedEndTime?: Date;
}

export interface CreateVisitInput {
   groupType: VisitorGroupType;
   durationType: VisitDurationType;
   purpose: VisitPurpose | string;
   hostEmployeeId: number;
   visitors: VisitorInputForVisit[];
   scheduleDates: ScheduleDateInput[];
   floor?: string;
   room?: string;
   /** Required when visitors array is empty (unknown-visitor invitation). */
   expectedVisitorCount?: number;
   /** Required when visitors array is empty (unknown-visitor invitation). */
   organization?: string;
}

/** Context that differs between public, walk-in, and host-invitation paths. */
export interface CreateVisitMeta {
   source: VisitSource;
   createdById?: number;
}

export interface ApproveVisitInput {
   floor: string;
   room: string;
   note?: string;
}

export interface RescheduleVisitInput {
   scheduleDates: ScheduleDateInput[];
   floor?: string;
   room?: string;
   note?: string;
}

import type { InvitationCreated } from './visit-registration.types.js';

export interface CreateVisitResult {
   visit: VisitDetail;
   registrationInvitation?: InvitationCreated;
}
