import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
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
   employees: () => [...selfServiceQueryKeys.all, 'employees'] as const,
   employeeSearch: (params: EmployeeSearchParams) =>
      [...selfServiceQueryKeys.employees(), 'search', params] as const,
} as const;

// Host/employee autocomplete for the visit-request form.
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
         const { data } = await selfServiceService.submitVisitRequest(payload);
         return data.data;
      },
   });
}
