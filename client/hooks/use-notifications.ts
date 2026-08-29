import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { notificationsService } from '@/services/notifications.service';
import type { ApiErrorResponse } from '@/types/api.types';
import type {
   Notification,
   NotificationListParams,
   UnreadNotificationCountData,
} from '@/types/notification.types';

type ApiError = AxiosError<ApiErrorResponse>;

export const notificationQueryKeys = {
   all: ['notifications'] as const,
   lists: () => [...notificationQueryKeys.all, 'list'] as const,
   list: (params: NotificationListParams = {}) =>
      [...notificationQueryKeys.lists(), params] as const,
   unreadCount: () => [...notificationQueryKeys.all, 'unread-count'] as const,
   detail: (id: number) => [...notificationQueryKeys.all, 'detail', id] as const,
} as const;

export function useNotifications(params: NotificationListParams = {}) {
   return useQuery({
      queryKey: notificationQueryKeys.list(params),
      queryFn: async () => {
         const { data } = await notificationsService.getAll(params);
         return data.data;
      },
      staleTime: 30_000,
   });
}

export function useNotificationUnreadCount() {
   return useQuery({
      queryKey: notificationQueryKeys.unreadCount(),
      queryFn: async () => {
         const { data } = await notificationsService.getUnreadCount();
         return data.data;
      },
      staleTime: 30_000,
   });
}

export function useMarkNotificationAsRead() {
   const queryClient = useQueryClient();

   return useMutation<Notification, ApiError, number>({
      mutationFn: async (id) => {
         const { data } = await notificationsService.markAsRead(id);
         return data.data;
      },
      onSuccess: (updated) => {
         queryClient.setQueryData(
            notificationQueryKeys.lists(),
            (previous: Notification[] | undefined) =>
               previous
                  ? previous.map((notification) =>
                       notification.id === updated.id
                          ? { ...notification, isRead: true }
                          : notification,
                    )
                  : previous,
         );

         queryClient.setQueryData(
            notificationQueryKeys.unreadCount(),
            (previous: UnreadNotificationCountData | undefined) =>
               previous
                  ? {
                       ...previous,
                       unreadCount: Math.max(0, previous.unreadCount - 1),
                    }
                  : previous,
         );

         queryClient.invalidateQueries({
            queryKey: notificationQueryKeys.lists(),
         });
      },
   });
}

export function useMarkAllNotificationsRead() {
   const queryClient = useQueryClient();

   return useMutation<{ updatedCount: number }, ApiError, void>({
      mutationFn: async () => {
         const { data } = await notificationsService.markAllAsRead();
         return data.data;
      },
      onSuccess: () => {
         queryClient.setQueryData(
            notificationQueryKeys.lists(),
            (previous: Notification[] | undefined) =>
               previous
                  ? previous.map((notification) => ({
                       ...notification,
                       isRead: true,
                    }))
                  : previous,
         );

         queryClient.setQueryData(notificationQueryKeys.unreadCount(), {
            unreadCount: 0,
         });

         queryClient.invalidateQueries({
            queryKey: notificationQueryKeys.lists(),
         });
      },
   });
}
