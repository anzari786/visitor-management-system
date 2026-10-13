import { format, startOfDay } from 'date-fns';
import type { Prisma, VisitStatus } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { reconcileAttendanceForExpiredVisit } from '../visit-attendances/attendance-reconciliation.service.js';

/** Visit statuses that may transition to EXPIRED once the schedule ends. */
export const VISIT_STATUSES_ELIGIBLE_FOR_EXPIRATION: VisitStatus[] = [
   'PENDING_APPROVAL',
   'APPROVED',
   'RESCHEDULED',
   'PARTIALLY_CHECKED_IN',
   'CHECKED_IN',
   'PARTIALLY_CHECKED_OUT',
];

const BATCH_SIZE = 200;

export interface ExpireVisitsResult {
   expiredVisitCount: number;
   reconciledAttendanceCount: number;
   errors: Array<{ visitId: number; message: string }>;
}

export const buildVisitExpirationWhere = (
   now: Date = new Date(),
): Prisma.VisitWhereInput => {
   const today = startOfDay(now);
   const currentTime = format(now, 'HH:mm');

   return {
      status: { in: VISIT_STATUSES_ELIGIBLE_FOR_EXPIRATION },
      OR: [
         { endDate: { lt: today } },
         {
            endDate: today,
            endTime: { lt: currentTime },
         },
      ],
   };
};

const expireVisit = async (
   visitId: number,
   fromStatus: VisitStatus,
): Promise<number> => {
   return prisma.$transaction(async (tx) => {
      const updated = await tx.visit.updateMany({
         where: {
            id: visitId,
            status: fromStatus,
         },
         data: { status: 'EXPIRED' },
      });

      if (updated.count === 0) {
         return 0;
      }

      await tx.visitStatusHistory.create({
         data: {
            visitId,
            fromStatus,
            toStatus: 'EXPIRED',
            note: 'Automatically expired after scheduled visit end',
         },
      });

      const reconciliation = await reconcileAttendanceForExpiredVisit(
         visitId,
         tx,
      );

      return reconciliation.expectedMarkedNoShow;
   });
};

/**
 * Expires visits whose scheduled end has passed. Processes eligible rows in
 * ID-ordered batches so the full table is never loaded into memory.
 */
export const expireEligibleVisits = async (
   now: Date = new Date(),
): Promise<ExpireVisitsResult> => {
   const where = buildVisitExpirationWhere(now);
   const result: ExpireVisitsResult = {
      expiredVisitCount: 0,
      reconciledAttendanceCount: 0,
      errors: [],
   };

   let lastId = 0;

   while (true) {
      const batch = await prisma.visit.findMany({
         where: {
            AND: [where, { id: { gt: lastId } }],
         },
         select: { id: true, status: true },
         orderBy: { id: 'asc' },
         take: BATCH_SIZE,
      });

      if (batch.length === 0) {
         break;
      }

      for (const visit of batch) {
         lastId = visit.id;

         if (!VISIT_STATUSES_ELIGIBLE_FOR_EXPIRATION.includes(visit.status)) {
            continue;
         }

         try {
            const reconciledCount = await expireVisit(visit.id, visit.status);
            if (reconciledCount >= 0) {
               result.expiredVisitCount += 1;
               result.reconciledAttendanceCount += reconciledCount;
            }
         } catch (error) {
            result.errors.push({
               visitId: visit.id,
               message:
                  error instanceof Error ? error.message : String(error),
            });
         }
      }
   }

   return result;
};
