import { api } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type { ApiResponse } from '@/types/api.types';
import type {
   ApproveHostVisitPayload,
   CancelHostVisitPayload,
   CreateHostInvitationPayload,
   HostAvailableBadge,
   HostInvitation,
   HostNotification,
   HostProfile,
   HostRoom,
   HostVisit,
   HostVisitsParams,
   MarkNotificationsReadPayload,
   RejectHostVisitPayload,
   RescheduleHostVisitPayload,
   ResendApprovalEmailData,
} from '@/types/host.types';

/**
 * Host Portal API service.
 * Paths are placeholders in `API_ENDPOINTS` — update when the backend is ready.
 */
export const hostService = {
   getProfile() {
      return api.get<ApiResponse<HostProfile>>(API_ENDPOINTS.host.profile);
   },

   getPendingVisits(params?: HostVisitsParams) {
      return api.get<ApiResponse<HostVisit[]>>(
         API_ENDPOINTS.host.pendingVisits,
         { params },
      );
   },

   getUpcomingVisits(params?: HostVisitsParams) {
      return api.get<ApiResponse<HostVisit[]>>(
         API_ENDPOINTS.host.upcomingVisits,
         { params },
      );
   },

   getVisits(params?: HostVisitsParams) {
      return api.get<ApiResponse<HostVisit[]>>(API_ENDPOINTS.host.visits, {
         params,
      });
   },

   getVisit(id: string) {
      return api.get<ApiResponse<HostVisit>>(API_ENDPOINTS.host.visit(id));
   },

   approveVisit(id: string, payload: ApproveHostVisitPayload) {
      return api.post<ApiResponse<HostVisit>>(
         API_ENDPOINTS.host.approveVisit(id),
         payload,
      );
   },

   rejectVisit(id: string, payload?: RejectHostVisitPayload) {
      return api.post<ApiResponse<HostVisit>>(
         API_ENDPOINTS.host.rejectVisit(id),
         payload ?? {},
      );
   },

   rescheduleVisit(id: string, payload: RescheduleHostVisitPayload) {
      return api.patch<ApiResponse<HostVisit>>(
         API_ENDPOINTS.host.rescheduleVisit(id),
         payload,
      );
   },

   cancelVisit(id: string, payload?: CancelHostVisitPayload) {
      return api.post<ApiResponse<HostVisit>>(
         API_ENDPOINTS.host.cancelVisit(id),
         payload ?? {},
      );
   },

   resendApprovalEmail(id: string) {
      return api.post<ApiResponse<ResendApprovalEmailData>>(
         API_ENDPOINTS.host.resendApprovalEmail(id),
      );
   },

   createInvitation(payload: CreateHostInvitationPayload) {
      return api.post<ApiResponse<HostInvitation>>(
         API_ENDPOINTS.host.invitations,
         payload,
      );
   },

   getInvitation(id: string) {
      return api.get<ApiResponse<HostInvitation>>(
         API_ENDPOINTS.host.invitation(id),
      );
   },

   getRooms(params?: { floor?: string; search?: string }) {
      return api.get<ApiResponse<HostRoom[]>>(API_ENDPOINTS.host.rooms, {
         params,
      });
   },

   getAvailableBadges() {
      return api.get<ApiResponse<HostAvailableBadge[]>>(
         API_ENDPOINTS.host.badges,
      );
   },

   getNotifications(params?: { unreadOnly?: boolean }) {
      return api.get<ApiResponse<HostNotification[]>>(
         API_ENDPOINTS.host.notifications,
         { params },
      );
   },

   markNotificationRead(id: string) {
      return api.patch<ApiResponse<HostNotification>>(
         API_ENDPOINTS.host.markNotificationRead(id),
      );
   },

   markAllNotificationsRead(payload?: MarkNotificationsReadPayload) {
      return api.post<ApiResponse<{ updatedCount: number }>>(
         API_ENDPOINTS.host.markAllNotificationsRead,
         payload ?? {},
      );
   },
};
