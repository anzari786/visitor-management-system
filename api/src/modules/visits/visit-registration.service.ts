import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import {
   BadRequestError,
   ConflictError,
   NotFoundError,
} from '../../lib/errors.js';
import { resolveVisitorForRegistration } from '../visitors/visitor.service.js';
import { notifyVisitorRegistered } from '../../services/visit-notifications.service.js';
import { visitDetailSelect } from './visit.types.js';
import type {
   RegisterVisitorInput,
   RegistrationProgress,
   RegistrationResult,
   VisitTransactionClient,
} from './visit-registration.types.js';

const REGISTRATION_ELIGIBLE_STATUSES = new Set([
   'APPROVED',
   'RESCHEDULED',
   'PARTIALLY_CHECKED_IN',
   'CHECKED_IN',
   'PARTIALLY_CHECKED_OUT',
]);

export const seedAttendancesForParticipant = async (
   participantId: number,
   visitId: number,
   db: VisitTransactionClient = prisma,
) => {
   const days = await db.visitDay.findMany({
      where: { visitId },
      select: { id: true },
   });

   if (!days.length) {
      return;
   }

   await db.visitAttendance.createMany({
      data: days.map((day) => ({
         participantId,
         visitDayId: day.id,
         status: 'EXPECTED' as const,
      })),
      skipDuplicates: true,
   });
};

const getRegistrationProgress = async (
   visitId: number,
   db: VisitTransactionClient = prisma,
): Promise<RegistrationProgress> => {
   const visit = await db.visit.findUnique({
      where: { id: visitId },
      select: {
         expectedVisitorCount: true,
         participants: {
            select: {
               id: true,
               visitor: {
                  select: {
                     firstName: true,
                     lastName: true,
                     organization: true,
                  },
               },
            },
            orderBy: { createdAt: 'asc' },
         },
      },
   });

   if (!visit) {
      throw new NotFoundError('Visit not found');
   }

   const registeredCount = visit.participants.length;
   const remainingSlots = Math.max(
      0,
      visit.expectedVisitorCount - registeredCount,
   );

   return {
      expectedVisitorCount: visit.expectedVisitorCount,
      registeredCount,
      remainingSlots,
      isFull: registeredCount >= visit.expectedVisitorCount,
      participants: visit.participants.map((participant) => ({
         participantId: String(participant.id),
         visitor: {
            firstName: participant.visitor.firstName,
            lastName: participant.visitor.lastName,
            organization: participant.visitor.organization ?? undefined,
         },
      })),
   };
};

const assertVisitEligibleForRegistration = (visit: {
   status: string;
   source: string;
}) => {
   if (!REGISTRATION_ELIGIBLE_STATUSES.has(visit.status)) {
      throw new BadRequestError(
         `Visit is not open for registration (status: ${visit.status})`,
         'VISIT_NOT_ELIGIBLE',
      );
   }

   if (visit.source !== 'HOST_INVITATION') {
      throw new BadRequestError(
         'Only host invitations support visitor registration',
         'INVALID_VISIT_SOURCE',
      );
   }
};

/**
 * Core registration operation shared by invitation-link and reception paths.
 * Uses a serializable transaction with row lock to enforce capacity safely.
 */
export const registerVisitorForVisit = async (
   visitId: number,
   input: RegisterVisitorInput,
   options?: { notifyHost?: boolean },
): Promise<RegistrationResult> => {
   const result = await prisma.$transaction(
      async (tx) => {
         await tx.$executeRaw`SELECT id FROM visits WHERE id = ${visitId} FOR UPDATE`;

         const visit = await tx.visit.findUnique({
            where: { id: visitId },
            select: {
               id: true,
               status: true,
               source: true,
               expectedVisitorCount: true,
               _count: { select: { participants: true } },
            },
         });

         if (!visit) {
            throw new NotFoundError('Visit not found');
         }

         assertVisitEligibleForRegistration(visit);

         if (visit._count.participants >= visit.expectedVisitorCount) {
            throw new ConflictError(
               'Registration capacity has been reached for this visit',
               'REGISTRATION_FULL',
            );
         }

         const visitor = await resolveVisitorForRegistration(input, tx);

         const existingParticipant = await tx.visitParticipant.findUnique({
            where: {
               visitId_visitorId: {
                  visitId,
                  visitorId: visitor.id,
               },
            },
         });

         if (existingParticipant) {
            throw new ConflictError(
               'This visitor is already registered for this visit',
               'VISITOR_ALREADY_REGISTERED',
            );
         }

         const participant = await tx.visitParticipant.create({
            data: {
               visitId,
               visitorId: visitor.id,
            },
         });

         await seedAttendancesForParticipant(participant.id, visitId, tx);

         const progress = await getRegistrationProgress(visitId, tx);

         return {
            participantId: participant.id,
            visitorId: visitor.id,
            visitId,
            progress,
         };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
   );

   if (options?.notifyHost !== false) {
      const visit = await prisma.visit.findUnique({
         where: { id: visitId },
         select: visitDetailSelect,
      });

      if (visit) {
         await notifyVisitorRegistered(visit, {
            firstName: input.firstName,
            lastName: input.lastName,
         });
      }
   }

   return result;
};

export const getVisitRegistrationProgress = async (
   visitId: number,
): Promise<RegistrationProgress> => getRegistrationProgress(visitId);

export const formatRegistrationProgress = (progress: RegistrationProgress) => ({
   expectedVisitorCount: progress.expectedVisitorCount,
   registeredCount: progress.registeredCount,
   remainingSlots: progress.remainingSlots,
   isFull: progress.isFull,
   participants: progress.participants,
});

export const formatRegistrationResult = (result: RegistrationResult) => ({
   participantId: String(result.participantId),
   visitorId: String(result.visitorId),
   visitId: String(result.visitId),
   progress: formatRegistrationProgress(result.progress),
});
