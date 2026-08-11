import { api } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type { ApiResponse } from '@/types/api.types';
import type {
   EmployeeSearchParams,
   EmployeeSearchResult,
   SelfServiceDepartment,
   SelfServicePurposeOption,
   SelfServiceVisitRequest,
   SubmitVisitRequestPayload,
   SubmitVisitRequestResponse,
} from '@/types/self-service.types';

/**
 * Self-Service (public visit request) API service.
 * Paths are placeholders in `API_ENDPOINTS` — update when the backend is ready.
 */
export const selfServiceService = {
   submitVisitRequest(payload: SubmitVisitRequestPayload) {
      return api.post<ApiResponse<SubmitVisitRequestResponse>>(
         API_ENDPOINTS.selfService.visits,
         payload,
      );
   },

   getVisitRequest(id: string) {
      return api.get<ApiResponse<SelfServiceVisitRequest>>(
         API_ENDPOINTS.selfService.visit(id),
      );
   },

   getDepartments() {
      return api.get<ApiResponse<SelfServiceDepartment[]>>(
         API_ENDPOINTS.selfService.departments,
      );
   },

   getPurposes() {
      return api.get<ApiResponse<SelfServicePurposeOption[]>>(
         API_ENDPOINTS.selfService.purposes,
      );
   },

   searchEmployees(params: EmployeeSearchParams = {}) {
      return api.get<ApiResponse<EmployeeSearchResult[]>>(
         API_ENDPOINTS.employees.search,
         { params },
      );
   },
};
