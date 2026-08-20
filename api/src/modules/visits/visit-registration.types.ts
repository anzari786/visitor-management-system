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

export interface InvitationPreview {
   visitCode: string;
   purpose: string;
   organization?: string;
   expectedVisitorCount: number;
   registeredCount: number;
   remainingSlots: number;
   isFull: boolean;
   isActive: boolean;
   hostName?: string;
   departmentName?: string;
   floor?: string;
   room?: string;
   startDate: Date;
   endDate: Date;
   startTime: string;
   endTime: string;
   scheduleDates: Date[];
}

export interface InvitationCreated {
   registrationUrl: string;
   expiresAt?: Date;
   /** Present in development when SMTP is not configured. */
   registrationToken?: string;
}

export type VisitTransactionClient = Omit<
   Prisma.TransactionClient,
   '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;
