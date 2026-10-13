import { z } from 'zod';

const exportPeriodEnum = z.enum(['7d', '30d', '3m', '6m', 'all', 'custom']);
const visitStatusEnum = z.enum([
   'PENDING_APPROVAL',
   'APPROVED',
   'REJECTED',
   'EXPIRED',
   'RESCHEDULED',
   'CANCELLED',
   'PARTIALLY_CHECKED_IN',
   'CHECKED_IN',
   'PARTIALLY_CHECKED_OUT',
   'CHECKED_OUT',
]);

export const dashboardStatsSchema = z.object({
   query: z.object({
      filter: z
         .enum([
            'all',
            'today',
            'yesterday',
            'last_7_days',
            'last_30_days',
            'this_month',
         ])
         .default('today'),
   }),
});

export const visitGrowthSchema = z.object({
   query: z.object({
      period: z.enum(['3m', '6m', '12m']).default('12m'),
   }),
});

export const chartRangeSchema = z.object({
   query: z.object({
      range: z.enum(['7days', '30days', '90days']).default('30days'),
   }),
});

export const exportVisitLogSchema = z.object({
   query: z
      .object({
         period: exportPeriodEnum,
         departmentId: z.coerce.number().int().positive().optional(),
         departmentName: z.string().trim().min(1).optional(),
         status: visitStatusEnum.optional(),
         from: z.string().date().optional(),
         to: z.string().date().optional(),
      })
      .refine((data) => data.period !== 'custom' || (data.from && data.to), {
         message: 'from and to are required when period is custom',
         path: ['from'],
      }),
});

export type DashboardStatsQuery = z.infer<typeof dashboardStatsSchema>['query'];
export type VisitGrowthQuery = z.infer<typeof visitGrowthSchema>['query'];
export type ChartRangeQuery = z.infer<typeof chartRangeSchema>['query'];
export type ExportVisitLogQuery = z.infer<typeof exportVisitLogSchema>['query'];

export type DateFilter = DashboardStatsQuery['filter'];
export type GrowthPeriod = VisitGrowthQuery['period'];
export type ChartTimeRange = ChartRangeQuery['range'];
