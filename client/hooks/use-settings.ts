import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { settingsService } from '@/services/settings.service';
import type {
   Settings,
   SettingsWithStatus,
   UpdateGeneralPayload,
} from '@/types/setting.types';
import { useHealth } from '@/hooks/use-health';
import { Status } from '@/components/shared/status-badge';
import type { ApiErrorResponse } from '@/types/api.types';

type ApiError = AxiosError<ApiErrorResponse>;

export const settingsKeys = {
   all: ['settings'] as const,
   detail: () => [...settingsKeys.all, 'detail'] as const,
};

export function useSettings(enabled = true) {
   return useQuery({
      queryKey: settingsKeys.detail(),
      queryFn: async () => {
         const { data } = await settingsService.get();
         return data.data;
      },
      staleTime: 1000 * 60 * 5, // treat settings as fresh for 5 min
      enabled,
   });
}

function deriveSystemStatus(isError: boolean): Status {
   return isError ? 'inactive' : 'active';
}

export function useSettingsWithStatus(enabled = true) {
   const settingsQuery = useSettings(enabled);
   const healthQuery = useHealth();

   const data: SettingsWithStatus | undefined = settingsQuery.data
      ? {
           ...settingsQuery.data,
           status: deriveSystemStatus(healthQuery.isError),
        }
      : undefined;

   return {
      data,
      isLoading: enabled && (settingsQuery.isLoading || healthQuery.isLoading),
      isError: settingsQuery.isError || healthQuery.isError,
      error: settingsQuery.error || healthQuery.error,
   };
}

export function useUpdateGeneralSettings() {
   const queryClient = useQueryClient();

   return useMutation<Settings, ApiError, UpdateGeneralPayload>({
      mutationFn: async (payload) => {
         const { data } = await settingsService.updateGeneral(payload);
         return data.data;
      },
      onSuccess: (updated) => {
         queryClient.setQueryData(settingsKeys.detail(), updated);
      },
   });
}
