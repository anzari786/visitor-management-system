import type {
   IdentificationType,
   Prisma,
   VisitDurationType,
   VisitorGroupType,
} from '../../generated/prisma/client.js';

/** Full record shape for the visit detail view. */
export const visitDetailSelect = {
   id: true,
   visitCode: true,
   qrToken: true,
   groupType: true,
   durationType: true,
   status: true,
   purpose: true,
   isAssisted: true,
   hostEmailSnapshot: true,
   departmentNameSnapshot: true,
   departmentCodeSnapshot: true,
   decisionAt: true,
   decisionNote: true,
   visitExpiresAt: true,
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
   schedules: {
      select: {
         id: true,
         date: true,
         expectedStartTime: true,
         expectedEndTime: true,
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
               employee: {
                  select: { firstName: true, lastName: true },
               },
            },
         },
      },
      orderBy: { createdAt: 'desc' },
   },
} satisfies Prisma.VisitSelect;

export type VisitDetail = Prisma.VisitGetPayload<{
   select: typeof visitDetailSelect;
}>;

/** Lighter shape for the visit list/search view. */
export const visitSummarySelect = {
   id: true,
   visitCode: true,
   groupType: true,
   durationType: true,
   status: true,
   purpose: true,
   isAssisted: true,
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
   schedules: {
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
   idType: IdentificationType;
   idNumber: string;
}

export interface ScheduleDateInput {
   date: Date;
   expectedStartTime?: Date;
   expectedEndTime?: Date;
}

export interface CreateVisitInput {
   groupType: VisitorGroupType;
   durationType: VisitDurationType;
   purpose: string;
   hostEmployeeId: number;
   visitors: VisitorInputForVisit[];
   scheduleDates: ScheduleDateInput[];
}

/** Context that differs between the public request and walk-in paths. */
export interface CreateVisitMeta {
   isAssisted: boolean;
   createdById?: number;
}
