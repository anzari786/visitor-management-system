import {
   keepPreviousData,
   useMutation,
   useQuery,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { selfServiceService } from '@/services/self-service.service';
import type { ApiErrorResponse } from '@/types/api.types';
import type {
   EmployeeSearchParams,
   SubmitVisitRequestPayload,
   SubmitVisitRequestResponse,
} from '@/types/self-service.types';

type ApiError = AxiosError<ApiErrorResponse>;

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const selfServiceQueryKeys = {
   all: ['self-service'] as const,
   visits: () => [...selfServiceQueryKeys.all, 'visits'] as const,
   visitDetail: (id: string) =>
      [...selfServiceQueryKeys.visits(), 'detail', id] as const,
   departments: () => [...selfServiceQueryKeys.all, 'departments'] as const,
   purposes: () => [...selfServiceQueryKeys.all, 'purposes'] as const,
   employees: () => [...selfServiceQueryKeys.all, 'employees'] as const,
   employeeSearch: (params: EmployeeSearchParams) =>
      [...selfServiceQueryKeys.employees(), 'search', params] as const,
} as const;

// ─── Queries ───────────────────────────────────────────────────────────────────

export function useSelfServiceVisitRequest(id: string, enabled = true) {
   return useQuery({
      queryKey: selfServiceQueryKeys.visitDetail(id),
      queryFn: async () => {
         const { data } = await selfServiceService.getVisitRequest(id);
         return data.data;
      },
      enabled: enabled && !!id,
   });
}

export function useSelfServiceDepartments() {
   return useQuery({
      queryKey: selfServiceQueryKeys.departments(),
      queryFn: async () => {
         const { data } = await selfServiceService.getDepartments();
         return data.data;
      },
      staleTime: 10 * 60 * 1000,
   });
}

export function useSelfServicePurposes() {
   return useQuery({
      queryKey: selfServiceQueryKeys.purposes(),
      queryFn: async () => {
         const { data } = await selfServiceService.getPurposes();
         return data.data;
      },
      staleTime: 10 * 60 * 1000,
   });
}

/**
 * Host/employee autocomplete for the visit-request form.
 * Debounce `params.q` in the UI before enabling the query.
 */
export function useEmployeeSearch(
   params: EmployeeSearchParams,
   enabled = true,
) {
   return useQuery({
      queryKey: selfServiceQueryKeys.employeeSearch(params),
      queryFn: async () => {
         const { data } = await selfServiceService.searchEmployees(params);
         return data.data;
      },
      enabled,
      placeholderData: keepPreviousData,
      staleTime: 30_000,
   });
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useSubmitVisitRequest() {
   return useMutation<
      SubmitVisitRequestResponse,
      ApiError,
      SubmitVisitRequestPayload
   >({
      mutationFn: async (payload) => {
         const { data } =
            await selfServiceService.submitVisitRequest(payload);
         return data.data;
      },
   });
}
