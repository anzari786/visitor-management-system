import { expireEligibleVisits } from '../modules/visits/visit-expiration.service.js';
import { registerDailyJob } from './scheduler.js';

export const runVisitExpirationJob = async (): Promise<void> => {
   const result = await expireEligibleVisits();

   console.log(
      `[visit-expiration] Expired ${result.expiredVisitCount} visit(s); reconciled ${result.reconciledAttendanceCount} EXPECTED attendance row(s) to NO_SHOW`,
   );

   if (result.errors.length > 0) {
      console.error(
         `[visit-expiration] ${result.errors.length} visit(s) failed to expire:`,
         result.errors,
      );
   }
};

export const registerVisitExpirationJob = (): void => {
   registerDailyJob('visit-expiration', 0, 5, runVisitExpirationJob);
};
