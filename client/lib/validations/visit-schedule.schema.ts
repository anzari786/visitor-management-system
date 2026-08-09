import { z } from 'zod';
import { startOfDay } from 'date-fns';

export const visitScheduleSchema = z
   .object({
      scheduleType: z.enum(['single_day', 'multi_day']),
      visitDate: z.date().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      startTime: z.string().min(1, 'Start time is required'),
      endTime: z.string().min(1, 'End time is required'),
   })
   .superRefine((data, ctx) => {
      if (data.scheduleType === 'single_day') {
         if (!data.visitDate) {
            ctx.addIssue({
               code: 'custom',
               path: ['visitDate'],
               message: 'Visit date is required',
            });
         }
      }

      if (data.scheduleType === 'multi_day') {
         if (!data.startDate) {
            ctx.addIssue({
               code: 'custom',
               path: ['startDate'],
               message: 'Start date is required',
            });
         }
         if (!data.endDate) {
            ctx.addIssue({
               code: 'custom',
               path: ['endDate'],
               message: 'End date is required',
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
               message: 'End date cannot be before start date',
            });
         }
      }

      if (data.startTime && data.endTime && data.startTime >= data.endTime) {
         ctx.addIssue({
            code: 'custom',
            path: ['endTime'],
            message: 'End time cannot be before start time',
         });
         ctx.addIssue({
            code: 'custom',
            path: ['startTime'],
            message: 'Start time must be before end time',
         });
      }
   });

export type VisitScheduleValues = z.output<typeof visitScheduleSchema>;
export type VisitScheduleInput = z.input<typeof visitScheduleSchema>;
