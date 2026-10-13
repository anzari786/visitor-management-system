import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dashboardService } from '@/services/dashboard.service';
import type {
   DateFilter,
   DepartmentTimeRange,
   ExportVisitLogParams,
   GrowthPeriod,
} from '@/types/dashboard.types';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const dashboardQueryKeys = {
   all: ['dashboard'] as const,
   stats: (filter: DateFilter) =>
      [...dashboardQueryKeys.all, 'stats', filter] as const,
   statsAll: () => [...dashboardQueryKeys.all, 'stats'] as const,
   growth: (period: GrowthPeriod) =>
      [...dashboardQueryKeys.all, 'growth', period] as const,
   meetings: (range: DepartmentTimeRange) =>
      [...dashboardQueryKeys.all, 'meetings', range] as const,
   departments: (range: DepartmentTimeRange) =>
      [...dashboardQueryKeys.all, 'departments', range] as const,
   departmentsAll: () => [...dashboardQueryKeys.all, 'departments'] as const,
};

// ─── Stats hook (driven by global date filter from the store) ────────────────────────────────────────────────────────────────

export function useVisitStats(filter: DateFilter) {
   return useQuery({
      queryKey: dashboardQueryKeys.stats(filter),
      queryFn: async () => {
         const { data } = await dashboardService.getStats(filter);
         return data.data;
      },
   });
}

// ─── Growth chart hook ────────────────────────────────────────────────────────────────

export function useVisitGrowth(period: GrowthPeriod) {
   return useQuery({
      queryKey: dashboardQueryKeys.growth(period),
      queryFn: async () => {
         const { data } = await dashboardService.getVisitGrowth(period);
         return data.data;
      },
   });
}

// ─── Meeting type chart hook ────────────────────────────────────────────────────────────────

export function useMeetingTypes(range: DepartmentTimeRange) {
   return useQuery({
      queryKey: dashboardQueryKeys.meetings(range),
      queryFn: async () => {
         const { data } = await dashboardService.getMeetingTypes(range);
         return data.data;
      },
   });
}

// ─── Department visits chart hook────────────────────────────────────────────────────────────────

export function useDepartmentVisits(range: DepartmentTimeRange) {
   return useQuery({
      queryKey: dashboardQueryKeys.departments(range),
      queryFn: async () => {
         const { data } = await dashboardService.getDepartmentVisits(range);
         return data.data;
      },
   });
}

function downloadBlob(blob: Blob, filename: string) {
   const url = URL.createObjectURL(blob);
   const link = document.createElement('a');

   link.href = url;
   link.download = filename;
   link.click();

   URL.revokeObjectURL(url);
}

function parseFilename(contentDisposition?: string): string | null {
   if (!contentDisposition) return null;

   const match = contentDisposition.match(/filename="?([^";]+)"?/i);
   return match?.[1] ?? null;
}

export function useExportVisitLog() {
   return useMutation<
      { blob: Blob; filename: string },
      Error,
      ExportVisitLogParams
   >({
      mutationFn: async (params) => {
         const response = await dashboardService.exportVisitLog(params);
         const date = new Date().toISOString().slice(0, 10);
         const filename =
            parseFilename(response.headers['content-disposition']) ??
            `visit-log-${date}.csv`;

         return { blob: response.data, filename };
      },
      onSuccess: ({ blob, filename }) => {
         downloadBlob(blob, filename);
         toast.success('Report downloaded successfully');
      },
      onError: () => {
         toast.error('Failed to export report. Please try again.');
      },
   });
}
