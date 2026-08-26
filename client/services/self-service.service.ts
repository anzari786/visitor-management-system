import { api } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type { ApiResponse } from '@/types/api.types';
import type {
   EmployeeSearchParams,
   EmployeeSearchResult,
   SubmitVisitRequestPayload,
   SubmitVisitRequestResponse,
} from '@/types/self-service.types';

/** Self-service visit request and public directory API service. */
export const selfServiceService = {
   submitVisitRequest(payload: SubmitVisitRequestPayload) {
      return api.post<ApiResponse<SubmitVisitRequestResponse>>(
         API_ENDPOINTS.selfService.visits,
         payload,
      );
   },

   searchEmployees(params: EmployeeSearchParams = {}) {
      return api.get<ApiResponse<EmployeeSearchResult[]>>(
         API_ENDPOINTS.employees.search,
         { params },
      );
   },
};
