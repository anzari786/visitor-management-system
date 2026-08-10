import { z } from 'zod';

const exportPeriodEnum = z.enum(['7d', '30d', '3m', '6m', 'all', 'custom']);

export const exportVisitLogSchema = z.object({
   query: z
      .object({
         period: exportPeriodEnum,
         departmentName: z.string().trim().min(1).optional(),
         from: z.string().date().optional(),
         to: z.string().date().optional(),
      })
      .refine((data) => data.period !== 'custom' || (data.from && data.to), {
         message: 'from and to are required when period is custom',
         path: ['from'],
      }),
});

export type ExportVisitLogQuery = z.infer<typeof exportVisitLogSchema>['query'];
