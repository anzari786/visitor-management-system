import {
   keepPreviousData,
   useMutation,
   useQuery,
   useQueryClient,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { hostService } from '@/services/host.service';
import type { ApiErrorResponse } from '@/types/api.types';
import type {
   ApproveHostVisitPayload,
   CancelHostVisitPayload,
   CreateHostInvitationPayload,
   HostInvitation,
   HostNotification,
   HostVisit,
   HostVisitsParams,
   MarkNotificationsReadPayload,
   RejectHostVisitPayload,
   RescheduleHostVisitPayload,
   ResendApprovalEmailData,
} from '@/types/host.types';

type ApiError = AxiosError<ApiErrorResponse>;

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const hostQueryKeys = {
   all: ['host'] as const,
   profile: () => [...hostQueryKeys.all, 'profile'] as const,
   visits: () => [...hostQueryKeys.all, 'visits'] as const,
   pendingVisits: (params?: HostVisitsParams) =>
      [...hostQueryKeys.visits(), 'pending', params ?? {}] as const,
   upcomingVisits: (params?: HostVisitsParams) =>
      [...hostQueryKeys.visits(), 'upcoming', params ?? {}] as const,
   visitList: (params?: HostVisitsParams) =>
      [...hostQueryKeys.visits(), 'list', params ?? {}] as const,
   visitDetail: (id: string) =>
      [...hostQueryKeys.visits(), 'detail', id] as const,
   invitations: () => [...hostQueryKeys.all, 'invitations'] as const,
   invitationDetail: (id: string) =>
      [...hostQueryKeys.invitations(), 'detail', id] as const,
   rooms: (params?: { floor?: string; search?: string }) =>
      [...hostQueryKeys.all, 'rooms', params ?? {}] as const,
   badges: () => [...hostQueryKeys.all, 'badges'] as const,
   notifications: (params?: { unreadOnly?: boolean }) =>
      [...hostQueryKeys.all, 'notifications', params ?? {}] as const,
} as const;

function invalidateHostVisits(
   queryClient: ReturnType<typeof useQueryClient>,
) {
   queryClient.invalidateQueries({ queryKey: hostQueryKeys.visits() });
}

// ─── Queries ───────────────────────────────────────────────────────────────────

export function useHostProfile() {
   return useQuery({
      queryKey: hostQueryKeys.profile(),
      queryFn: async () => {
         const { data } = await hostService.getProfile();
         return data.data;
      },
   });
}

export function useHostPendingVisits(params?: HostVisitsParams) {
   return useQuery({
      queryKey: hostQueryKeys.pendingVisits(params),
      queryFn: async () => {
         const { data } = await hostService.getPendingVisits(params);
         return data.data;
      },
      placeholderData: keepPreviousData,
   });
}

export function useHostUpcomingVisits(params?: HostVisitsParams) {
   return useQuery({
      queryKey: hostQueryKeys.upcomingVisits(params),
      queryFn: async () => {
         const { data } = await hostService.getUpcomingVisits(params);
         return data.data;
      },
      placeholderData: keepPreviousData,
   });
}

export function useHostVisits(params?: HostVisitsParams) {
   return useQuery({
      queryKey: hostQueryKeys.visitList(params),
      queryFn: async () => {
         const { data } = await hostService.getVisits(params);
         return data.data;
      },
      placeholderData: keepPreviousData,
   });
}

export function useHostVisit(id: string, enabled = true) {
   return useQuery({
      queryKey: hostQueryKeys.visitDetail(id),
      queryFn: async () => {
         const { data } = await hostService.getVisit(id);
         return data.data;
      },
      enabled: enabled && !!id,
   });
}

export function useHostInvitation(id: string, enabled = true) {
   return useQuery({
      queryKey: hostQueryKeys.invitationDetail(id),
      queryFn: async () => {
         const { data } = await hostService.getInvitation(id);
         return data.data;
      },
      enabled: enabled && !!id,
   });
}

export function useHostRooms(params?: { floor?: string; search?: string }) {
   return useQuery({
      queryKey: hostQueryKeys.rooms(params),
      queryFn: async () => {
         const { data } = await hostService.getRooms(params);
         return data.data;
      },
   });
}

export function useHostAvailableBadges(enabled = true) {
   return useQuery({
      queryKey: hostQueryKeys.badges(),
      queryFn: async () => {
         const { data } = await hostService.getAvailableBadges();
         return data.data;
      },
      enabled,
   });
}

export function useHostNotifications(params?: { unreadOnly?: boolean }) {
   return useQuery({
      queryKey: hostQueryKeys.notifications(params),
      queryFn: async () => {
         const { data } = await hostService.getNotifications(params);
         return data.data;
      },
   });
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useApproveHostVisit() {
   const queryClient = useQueryClient();

   return useMutation<
      HostVisit,
      ApiError,
      { id: string; payload: ApproveHostVisitPayload }
   >({
      mutationFn: async ({ id, payload }) => {
         const { data } = await hostService.approveVisit(id, payload);
         return data.data;
      },
      onSuccess: (updated) => {
         invalidateHostVisits(queryClient);
         queryClient.setQueryData(
            hostQueryKeys.visitDetail(updated.id),
            updated,
         );
      },
   });
}

export function useRejectHostVisit() {
   const queryClient = useQueryClient();

   return useMutation<
      HostVisit,
      ApiError,
      { id: string; payload?: RejectHostVisitPayload }
   >({
      mutationFn: async ({ id, payload }) => {
         const { data } = await hostService.rejectVisit(id, payload);
         return data.data;
      },
      onSuccess: () => {
         invalidateHostVisits(queryClient);
      },
   });
}

export function useRescheduleHostVisit() {
   const queryClient = useQueryClient();

   return useMutation<
      HostVisit,
      ApiError,
      { id: string; payload: RescheduleHostVisitPayload }
   >({
      mutationFn: async ({ id, payload }) => {
         const { data } = await hostService.rescheduleVisit(id, payload);
         return data.data;
      },
      onSuccess: (updated) => {
         invalidateHostVisits(queryClient);
         queryClient.setQueryData(
            hostQueryKeys.visitDetail(updated.id),
            updated,
         );
      },
   });
}

export function useCancelHostVisit() {
   const queryClient = useQueryClient();

   return useMutation<
      HostVisit,
      ApiError,
      { id: string; payload?: CancelHostVisitPayload }
   >({
      mutationFn: async ({ id, payload }) => {
         const { data } = await hostService.cancelVisit(id, payload);
         return data.data;
      },
      onSuccess: () => {
         invalidateHostVisits(queryClient);
      },
   });
}

export function useResendHostApprovalEmail() {
   return useMutation<ResendApprovalEmailData, ApiError, string>({
      mutationFn: async (id) => {
         const { data } = await hostService.resendApprovalEmail(id);
         return data.data;
      },
   });
}

export function useCreateHostInvitation() {
   const queryClient = useQueryClient();

   return useMutation<HostInvitation, ApiError, CreateHostInvitationPayload>({
      mutationFn: async (payload) => {
         const { data } = await hostService.createInvitation(payload);
         return data.data;
      },
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: hostQueryKeys.invitations(),
         });
         invalidateHostVisits(queryClient);
      },
   });
}

export function useMarkHostNotificationRead() {
   const queryClient = useQueryClient();

   return useMutation<HostNotification, ApiError, string>({
      mutationFn: async (id) => {
         const { data } = await hostService.markNotificationRead(id);
         return data.data;
      },
      onSuccess: (updated) => {
         queryClient.setQueriesData<HostNotification[]>(
            { queryKey: [...hostQueryKeys.all, 'notifications'] },
            (old) =>
               old?.map((n) =>
                  n.id === updated.id ? { ...n, ...updated } : n,
               ),
         );
      },
   });
}

export function useMarkAllHostNotificationsRead() {
   const queryClient = useQueryClient();

   return useMutation<
      { updatedCount: number },
      ApiError,
      MarkNotificationsReadPayload | undefined
   >({
      mutationFn: async (payload) => {
         const { data } =
            await hostService.markAllNotificationsRead(payload);
         return data.data;
      },
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: [...hostQueryKeys.all, 'notifications'],
         });
      },
   });
}
