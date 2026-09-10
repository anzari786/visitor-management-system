import { api } from '@/lib/axios';
import type { ApiResponse, PaginatedApiResponse } from '@/types/api.types';
import type {
   ActiveVisitorsCountData,
   BackendVisitSummary,
   BadgeLookupData,
   CheckInPayload,
   CheckInData,
   RegisterVisitorPayload,
   CheckOutPayload,
   CheckOutData,
   Visit,
   VisitsParams,
} from '@/types/visit.types';

const VISITS_URL = '/v1/visits';

function serializeVisitQueryParams(params: Record<string, unknown>) {
   const searchParams = new URLSearchParams();

   Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;

      if (Array.isArray(value)) {
         value.forEach((item) => searchParams.append(key, String(item)));
         return;
      }

      searchParams.set(key, String(value));
   });

   return searchParams.toString();
}

export const visitsService = {
   getAll(params: VisitsParams) {
      return api.get<PaginatedApiResponse<BackendVisitSummary[]>>(
         `${VISITS_URL}`,
         {
            params: {
               page: params.page,
               limit: params.pageSize,
               search: params.search,
               status: params.status === 'all' ? undefined : params.status,
               source: params.source === 'all' ? undefined : params.source,
            },
            paramsSerializer: {
               serialize: serializeVisitQueryParams,
            },
         },
      );
   },

   getById(id: number) {
      return api.get<ApiResponse<Visit>>(`${VISITS_URL}/${id}`);
   },

   getActiveVisitByBadge(badgeNumber: number) {
      return api.get<ApiResponse<BadgeLookupData>>(
         `${VISITS_URL}active/${badgeNumber}`,
      );
   },

   getActiveVisitorsCount() {
      return api.get<ApiResponse<ActiveVisitorsCountData>>(
         `${VISITS_URL}/active-count`,
      );
   },

   checkIn(payload: CheckInPayload) {
      return api.post<ApiResponse<CheckInData>>(
         `${VISITS_URL}/check-in`,
         payload,
      );
   },

   registerVisitor({ visitId, ...payload }: RegisterVisitorPayload) {
      return api.post<ApiResponse<unknown>>(
         `${VISITS_URL}/${visitId}/register-visitor`,
         payload,
      );
   },

   checkOut(payload: CheckOutPayload) {
      return api.post<ApiResponse<CheckOutData>>(
         `${VISITS_URL}/check-out`,
         payload,
      );
   },

   checkOutById(id: number) {
      return api.patch<ApiResponse<Visit>>(`${VISITS_URL}/${id}/checkout`);
   },

   cancel(id: number) {
      return api.post<ApiResponse<Visit>>(`${VISITS_URL}/${id}/cancel`, {});
   },

   resendApprovalEmail(id: number) {
      return api.post<ApiResponse<Visit>>(
         `${VISITS_URL}/${id}/resend-approval-email`,
      );
   },
};
