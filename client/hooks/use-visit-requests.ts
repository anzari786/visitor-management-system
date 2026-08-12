import { visitRequestsService } from '@/services/visit-request.service';
import type { ApiErrorResponse } from '@/types/api.types';
import type {
   RejectVisitRequestPayload,
   VisitRequest,
   VisitRequestsParams,
} from '@/types/visit-request.types';
import {
   keepPreviousData,
   useMutation,
   useQuery,
   useQueryClient,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';

type ApiError = AxiosError<ApiErrorResponse>;

export const visitRequestQueryKeys = {
   all: ['visit-requests'] as const,
   lists: () => [...visitRequestQueryKeys.all, 'list'] as const,
   list: (params: VisitRequestsParams) =>
      [...visitRequestQueryKeys.lists(), params] as const,
   detail: (id: number) =>
      [...visitRequestQueryKeys.all, 'detail', id] as const,
} as const;

export function useVisitRequests(params: VisitRequestsParams) {
   return useQuery({
      queryKey: visitRequestQueryKeys.list(params),
      queryFn: async () => {
         const { data } = await visitRequestsService.getAll(params);
         return data.data;
      },
      placeholderData: keepPreviousData,
   });
}

export function useVisitRequest(id: number | null) {
   return useQuery({
      queryKey: visitRequestQueryKeys.detail(id ?? 0),
      queryFn: async () => {
         const { data } = await visitRequestsService.getById(id!);
         return data.data;
      },
      enabled: !!id,
   });
}

export function useApproveVisitRequest() {
   const queryClient = useQueryClient();

   return useMutation<VisitRequest, ApiError, number>({
      mutationFn: async (id) => {
         const { data } = await visitRequestsService.approve(id);
         return data.data;
      },
      onSuccess: (updated) => {
         queryClient.invalidateQueries({
            queryKey: visitRequestQueryKeys.lists(),
         });
         queryClient.setQueryData(
            visitRequestQueryKeys.detail(updated.id),
            updated,
         );
      },
   });
}

export function useRejectVisitRequest() {
   const queryClient = useQueryClient();

   return useMutation<VisitRequest, ApiError, RejectVisitRequestPayload>({
      mutationFn: async (payload) => {
         const { data } = await visitRequestsService.reject(payload);
         return data.data;
      },
      onSuccess: (updated) => {
         queryClient.invalidateQueries({
            queryKey: visitRequestQueryKeys.lists(),
         });
         queryClient.setQueryData(
            visitRequestQueryKeys.detail(updated.id),
            updated,
         );
      },
   });
}
