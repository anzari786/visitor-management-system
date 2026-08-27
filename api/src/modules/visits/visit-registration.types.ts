import type { Prisma } from '../../generated/prisma/client.js';
import type { VisitorInputForVisit } from './visit.types.js';

export interface RegisterVisitorInput {
   firstName: string;
   lastName: string;
   phone: string;
   email?: string;
   organization?: string;
   idType: VisitorInputForVisit['idType'];
   idNumber: string;
}

export interface RegistrationProgress {
   expectedVisitorCount: number;
   registeredCount: number;
   remainingSlots: number;
   isFull: boolean;
   participants: Array<{
      participantId: string;
      visitor: {
         firstName: string;
         lastName: string;
         organization?: string;
      };
   }>;
}

export interface RegistrationResult {
   participantId: number;
   visitorId: number;
   visitId: number;
   progress: RegistrationProgress;
}

export type VisitTransactionClient = Omit<
   Prisma.TransactionClient,
   '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;
