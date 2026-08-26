/**
 * Centralized API path definitions.
 *
 * `NEXT_PUBLIC_API_URL` already includes the `/api` prefix
 * (e.g. `http://localhost:5000/api`), so paths here are relative
 * to that base.
 *
 * Paths are relative to the API base URL.
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
      markNotificationRead: (id: string) => `/host/notifications/${id}/read`,
      markAllNotificationsRead: '/host/notifications/read-all',
   },
   selfService: {
      visits: '/v1/visits/request',
   },
   employees: {
      search: '/v1/employees/search-host',
   },
} as const;
