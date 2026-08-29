import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type {
   EmployeeSearchParams,
   EmployeeSearchResult,
   SubmitVisitRequestPayload,
   SubmitVisitRequestResponse,
} from '@/types/self-service.types';

const SELF_SERVICE_VISITS_URL = '/v1/self-service/visits';
const EMPLOYEES_SEARCH_URL = '/v1/employees/search';

/** Self-service visit request and public directory API service. */
export const selfServiceService = {
   submitVisitRequest(payload: SubmitVisitRequestPayload) {
      return api.post<ApiResponse<SubmitVisitRequestResponse>>(
         SELF_SERVICE_VISITS_URL,
         payload,
      );
   },

   searchEmployees(params: EmployeeSearchParams = {}) {
      return api.get<ApiResponse<EmployeeSearchResult[]>>(
         EMPLOYEES_SEARCH_URL,
         { params },
      );
   },
};
