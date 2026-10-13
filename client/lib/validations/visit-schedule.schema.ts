import { z } from 'zod';
import { startOfDay } from 'date-fns';

export const visitScheduleSchema = z
   .object({
      scheduleType: z.enum(['single_day', 'multi_day']),
      visitDate: z.date().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      startTime: z.string().min(1, 'validation.startTimeRequired'),
      endTime: z.string().min(1, 'validation.endTimeRequired'),
   })
   .superRefine((data, ctx) => {
      if (data.scheduleType === 'single_day') {
         if (!data.visitDate) {
            ctx.addIssue({
               code: 'custom',
               path: ['visitDate'],
               message: 'validation.visitDateRequired',
            });
         }
      }

      if (data.scheduleType === 'multi_day') {
         if (!data.startDate) {
            ctx.addIssue({
               code: 'custom',
               path: ['startDate'],
               message: 'validation.startDateRequired',
            });
         }
         if (!data.endDate) {
            ctx.addIssue({
               code: 'custom',
               path: ['endDate'],
               message: 'validation.endDateRequired',
            });
         }
         if (
            data.startDate &&
            data.endDate &&
            startOfDay(data.endDate) < startOfDay(data.startDate)
         ) {
            ctx.addIssue({
               code: 'custom',
               path: ['endDate'],
               message: 'validation.endDateBeforeStart',
            });
         }
      }

      if (data.startTime && data.endTime && data.startTime >= data.endTime) {
         ctx.addIssue({
            code: 'custom',
            path: ['endTime'],
            message: 'validation.endTimeBeforeStart',
         });
         ctx.addIssue({
            code: 'custom',
            path: ['startTime'],
            message: 'validation.startBeforeEnd',
         });
      }
   });

export type VisitScheduleValues = z.output<typeof visitScheduleSchema>;
export type VisitScheduleInput = z.input<typeof visitScheduleSchema>;
