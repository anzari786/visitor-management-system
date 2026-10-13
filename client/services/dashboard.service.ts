import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type {
   DateFilter,
   DepartmentTimeRange,
   DepartmentVisitsData,
   ExportVisitLogParams,
   GrowthPeriod,
   MeetingTypeChartData,
   VisitGrowthDataPoint,
   VisitStats,
} from '@/types/dashboard.types';

const BASE = '/v1/dashboard';

export const dashboardService = {
   getStats(filter: DateFilter) {
      return api.get<ApiResponse<VisitStats>>(`${BASE}/stats`, {
         params: { filter },
      });
   },

   getVisitGrowth(period: GrowthPeriod) {
      return api.get<ApiResponse<VisitGrowthDataPoint[]>>(
         `${BASE}/visit-growth`,
         {
            params: { period },
         },
      );
   },

   getMeetingTypes(range: DepartmentTimeRange) {
      return api.get<ApiResponse<MeetingTypeChartData>>(
         `${BASE}/meeting-types`,
         {
            params: { range },
         },
      );
   },

   getDepartmentVisits(range: DepartmentTimeRange) {
      return api.get<ApiResponse<DepartmentVisitsData>>(
         `${BASE}/department-visits`,
         {
            params: { range },
         },
      );
   },

   exportVisitLog(params: ExportVisitLogParams) {
      return api.get<Blob>(`${BASE}/export`, {
         params,
         responseType: 'blob',
      });
   },
};
