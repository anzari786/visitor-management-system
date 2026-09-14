import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';

type DbClient = Prisma.TransactionClient | typeof prisma;

export interface AttendanceReconciliationResult {
   expectedMarkedNoShow: number;
}

/**
 * When a visit expires, remaining EXPECTED attendance rows should not stay
 * active. CHECKED_IN / CHECKED_OUT / NO_SHOW history is preserved as-is.
 */
export const reconcileAttendanceForExpiredVisit = async (
   visitId: number,
   db: DbClient = prisma,
): Promise<AttendanceReconciliationResult> => {
   const update = await db.visitAttendance.updateMany({
      where: {
         status: 'EXPECTED',
         participant: { visitId },
      },
      data: { status: 'NO_SHOW' },
   });

   return { expectedMarkedNoShow: update.count };
};
