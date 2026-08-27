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

export const hostService = {
   getPendingVisits(params?: HostVisitsParams) {
      return api.get<ApiResponse<HostVisit[]>>(
         '/v1/employees/me/visits/pending-approvals',
         { params },
      );
   },

   getUpcomingVisits(params?: HostVisitsParams) {
      return api.get<ApiResponse<HostVisit[]>>(
         '/v1/employees/me/visits/upcoming',
         { params },
      );
   },

   approveVisit(id: string, payload: ApproveHostVisitPayload) {
      return api.post<ApiResponse<HostVisit>>(
         `/v1/visits/${id}/approve`,
         payload,
      );
   },

   rejectVisit(id: string, payload?: RejectHostVisitPayload) {
      return api.post<ApiResponse<HostVisit>>(
         `/v1/visits/${id}/reject`,
         payload ?? {},
      );
   },

   rescheduleVisit(id: string, payload: RescheduleHostVisitPayload) {
      return api.post<ApiResponse<HostVisit>>(
         `/v1/visits/${id}/reschedule`,
         payload,
      );
   },

   cancelVisit(id: string, payload?: CancelHostVisitPayload) {
      return api.post<ApiResponse<HostVisit>>(
         `/v1/visits/${id}/cancel`,
         payload ?? {},
      );
   },

   createHostInvitation(payload: CreateHostInvitationApiPayload) {
      return api.post<ApiResponse<HostInvitationCreated>>(
         '/v1/visits/invite',
         payload,
      );
   },
};
