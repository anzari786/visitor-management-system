/**
 * Centralized API path definitions.
 *
 * `NEXT_PUBLIC_API_URL` already includes the `/api` prefix
 * (e.g. `http://localhost:5000/api`), so paths here are relative
 * to that base — `/host/visits` resolves to `/api/host/visits`.
 *
 * Update these constants when the backend routes are finalized.
 */
export const API_ENDPOINTS = {
   host: {
      profile: '/host/profile',
      visits: '/host/visits',
      visit: (id: string) => `/host/visits/${id}`,
      pendingVisits: '/host/visits/pending',
      upcomingVisits: '/host/visits/upcoming',
      approveVisit: (id: string) => `/host/visits/${id}/approve`,
      rejectVisit: (id: string) => `/host/visits/${id}/reject`,
      rescheduleVisit: (id: string) => `/host/visits/${id}/reschedule`,
      cancelVisit: (id: string) => `/host/visits/${id}/cancel`,
      resendApprovalEmail: (id: string) =>
         `/host/visits/${id}/resend-approval-email`,
      invitations: '/host/invitations',
      invitation: (id: string) => `/host/invitations/${id}`,
      rooms: '/host/rooms',
      notifications: '/host/notifications',
      notification: (id: string) => `/host/notifications/${id}`,
      markNotificationRead: (id: string) =>
         `/host/notifications/${id}/read`,
      markAllNotificationsRead: '/host/notifications/read-all',
   },
   selfService: {
      visits: '/self-service/visits',
      visit: (id: string) => `/self-service/visits/${id}`,
      departments: '/self-service/departments',
      purposes: '/self-service/purposes',
   },
   employees: {
      search: '/employees/search',
   },
} as const;
