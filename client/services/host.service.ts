import { api } from '@/lib/axios';
import type { CreateHostInvitationApiPayload } from '@/lib/map-host-invitation';
import type { ApiResponse } from '@/types/api.types';
import type {
   ApproveHostVisitPayload,
   CancelHostVisitPayload,
   HostVisit,
   HostVisitsParams,
   RejectHostVisitPayload,
   RescheduleHostVisitPayload,
} from '@/types/host.types';

export type HostInvitationCreated = {
   id: string;
   visitCode: string;
};

const EMPLOYEE_VISITS_BASE = '/v1/employees/me/visits';
const VISITS_BASE = '/v1/visits';

export const hostService = {
   getPendingVisits(params?: HostVisitsParams) {
      return api.get<ApiResponse<HostVisit[]>>(
         `${EMPLOYEE_VISITS_BASE}/pending-approvals`,
         { params },
      );
   },

   getUpcomingVisits(params?: HostVisitsParams) {
      return api.get<ApiResponse<HostVisit[]>>(
         `${EMPLOYEE_VISITS_BASE}/upcoming`,
         { params },
      );
   },

   approveVisit(id: string, payload: ApproveHostVisitPayload) {
      return api.post<ApiResponse<HostVisit>>(
         `${VISITS_BASE}/${id}/approve`,
         payload,
      );
   },

   rejectVisit(id: string, payload?: RejectHostVisitPayload) {
      return api.post<ApiResponse<HostVisit>>(
         `${VISITS_BASE}/${id}/reject`,
         payload ?? {},
      );
   },

   rescheduleVisit(id: string, payload: RescheduleHostVisitPayload) {
      return api.post<ApiResponse<HostVisit>>(
         `${VISITS_BASE}/${id}/reschedule`,
         payload,
      );
   },

   cancelVisit(id: string, payload?: CancelHostVisitPayload) {
      return api.post<ApiResponse<HostVisit>>(
         `${VISITS_BASE}/${id}/cancel`,
         payload ?? {},
      );
   },

   createHostInvitation(payload: CreateHostInvitationApiPayload) {
      return api.post<ApiResponse<HostInvitationCreated>>(
         `${VISITS_BASE}/invite`,
         payload,
      );
   },
};
