import { visitsService } from '@/services/visits.service';
import type { ApiErrorResponse } from '@/types/api.types';
import type {
   BadgeLookupData,
   CheckInPayload,
   CheckInData,
   CheckOutPayload,
   CheckOutData,
   Visit,
   VisitsParams,
} from '@/types/visit.types';
import {
   keepPreviousData,
   QueryClient,
   useMutation,
   useQuery,
   useQueryClient,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { dashboardQueryKeys } from './use-dashboard';

type ApiError = AxiosError<ApiErrorResponse>;

function invalidateDownstream(queryClient: QueryClient) {
   queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.statsAll() });
   queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.departmentsAll(),
   });
}

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const visitQueryKeys = {
   all: ['visits'] as const,
   lists: () => [...visitQueryKeys.all, 'list'] as const,
   list: (params: VisitsParams) => [...visitQueryKeys.lists(), params] as const,
   detail: (id: number) => [...visitQueryKeys.all, 'detail', id] as const,
   activeVisitorsCount: () =>
      [...visitQueryKeys.all, 'active-visitors-count'] as const,
   activeBadge: (badgeNumber?: number) =>
      [...visitQueryKeys.all, 'active-badge', badgeNumber] as const,
} as const;

// ─── Queries ───────────────────────────────────────────────────────────────────

export function useVisits(params: VisitsParams) {
   return useQuery({
      queryKey: visitQueryKeys.list(params),
      queryFn: async () => {
         const { data } = await visitsService.getAll(params);
         return data.data;
      },
      placeholderData: keepPreviousData,
   });
}

export function useVisit(id: number) {
   return useQuery({
      queryKey: visitQueryKeys.detail(id),
      queryFn: async () => {
         const { data } = await visitsService.getById(id!);
         return data.data;
      },
      enabled: !!id,
   });
}

export function useActiveBadge(
   badgeNumber: number | undefined,
   enabled = false,
) {
   return useQuery<BadgeLookupData, ApiError>({
      queryKey: visitQueryKeys.activeBadge(badgeNumber ?? 0),
      queryFn: async () => {
         const { data } = await visitsService.getActiveVisitByBadge(
            badgeNumber!,
         );
         return data.data;
      },

      enabled: enabled && badgeNumber != null,
      retry: false,
      staleTime: 30_000,
   });
}

export function useActiveVisitorsCount() {
   return useQuery({
      queryKey: visitQueryKeys.activeVisitorsCount(),
      queryFn: async () => {
         const { data } = await visitsService.getActiveVisitorsCount();
         return data.data;
      },
   });
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useCheckInVisit() {
   const queryClient = useQueryClient();

   return useMutation<CheckInData, ApiError, CheckInPayload>({
      mutationFn: async (payload) => {
         const { data } = await visitsService.checkIn(payload);
         return data.data;
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: visitQueryKeys.lists() });
         queryClient.invalidateQueries({
            queryKey: visitQueryKeys.activeVisitorsCount(),
         });
         invalidateDownstream(queryClient);
      },
   });
}

export function useCheckOutVisit() {
   const queryClient = useQueryClient();

   return useMutation<CheckOutData, ApiError, CheckOutPayload>({
      mutationFn: async (payload) => {
         const { data } = await visitsService.checkOut(payload);
         return data.data;
      },
      onSuccess: (updated) => {
         queryClient.invalidateQueries({ queryKey: visitQueryKeys.lists() });
         queryClient.invalidateQueries({
            queryKey: visitQueryKeys.activeVisitorsCount(),
         });
         queryClient.setQueryData(visitQueryKeys.detail(updated.id), (prev) =>
            prev
               ? {
                    ...prev,
                    status: 'completed',
                    checkOutTime: updated.checkOutTime,
                 }
               : prev,
         );
         invalidateDownstream(queryClient);
      },
   });
}

export function useCheckOutVisitById() {
   const queryClient = useQueryClient();

   return useMutation<Visit, ApiError, number>({
      mutationFn: async (id) => {
         const { data } = await visitsService.checkOutById(id);
         return data.data;
      },
      onSuccess: (updated) => {
         queryClient.invalidateQueries({ queryKey: visitQueryKeys.lists() });
         queryClient.invalidateQueries({
            queryKey: visitQueryKeys.activeVisitorsCount(),
         });
         queryClient.setQueryData(visitQueryKeys.detail(updated.id), (prev) =>
            prev ? { ...prev, ...updated } : prev,
         );
         invalidateDownstream(queryClient);
      },
   });
}

export function useCancelVisit() {
   const queryClient = useQueryClient();

   return useMutation<Visit, ApiError, number>({
      mutationFn: async (id) => {
         const { data } = await visitsService.cancel(id);
         return data.data;
      },
      onSuccess: (updated) => {
         queryClient.invalidateQueries({ queryKey: visitQueryKeys.lists() });
         queryClient.invalidateQueries({
            queryKey: visitQueryKeys.activeVisitorsCount(),
         });
         queryClient.setQueryData(visitQueryKeys.detail(updated.id), (prev) =>
            prev ? { ...prev, ...updated } : prev,
         );
         invalidateDownstream(queryClient);
      },
   });
}
