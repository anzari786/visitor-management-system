import type { IdType, Prisma } from '../../generated/prisma/client.js';

export const visitorSelect = {
   id: true,
   firstName: true,
   lastName: true,
   phone: true,
   email: true,
   organization: true,
   idType: true,
   idNumber: true,
   createdAt: true,
   updatedAt: true,
} satisfies Prisma.VisitorSelect;

export type VisitorWithSelect = Prisma.VisitorGetPayload<{
   select: typeof visitorSelect;
}>;

/** One past visit a visitor participated in, for the visitor history tab. */
export const visitorHistorySelect = {
   id: true,
   createdAt: true,
   visit: {
      select: {
         id: true,
         visitCode: true,
         status: true,
         source: true,
         purpose: true,
         createdAt: true,
         hostEmployee: {
            select: {
               firstName: true,
               lastName: true,
               departmentName: true,
            },
         },
      },
   },
} satisfies Prisma.VisitParticipantSelect;

export type VisitorHistoryEntry = Prisma.VisitParticipantGetPayload<{
   select: typeof visitorHistorySelect;
}>;

export interface VisitorInput {
   firstName: string;
   lastName: string;
   phone: string;
   email?: string;
   organization?: string;
   idType: IdType;
   idNumber: string;
}
