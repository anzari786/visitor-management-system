import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type {
   Notification,
   NotificationListParams,
   NotificationsListResponse,
   UnreadNotificationCountData,
} from '@/types/notification.types';

const BASE = '/v1/notifications';

export const notificationsService = {
   getAll(params: NotificationListParams = {}) {
      return api.get<ApiResponse<Notification[]> & NotificationsListResponse>(
         BASE,
         { params },
      );
   },

   getUnreadCount() {
      return api.get<ApiResponse<UnreadNotificationCountData>>(
         `${BASE}/unread-count`,
      );
   },

   getById(id: number) {
      return api.get<ApiResponse<Notification>>(`${BASE}/${id}`);
   },

   markAsRead(id: number) {
      return api.patch<ApiResponse<Notification>>(`${BASE}/${id}/read`);
   },

   markAllAsRead() {
      return api.post<ApiResponse<{ updatedCount: number }>>(
         `${BASE}/read-all`,
      );
   },
};
