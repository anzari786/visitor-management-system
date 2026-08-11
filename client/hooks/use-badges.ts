import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
   Badge,
   CreateBadgePayload,
   UpdateBadgeStatusPayload,
} from '@/types/badge.types';
import { badgesService } from '@/services/badges.service';
import { computeBadgeStats } from '@/lib/mock-badges';

export const badgeQueryKeys = {
   all: ['badges'] as const,
   lists: () => [...badgeQueryKeys.all, 'list'] as const,
   detail: (id: number) => [...badgeQueryKeys.all, 'detail', id] as const,
};

export function useBadges() {
   return useQuery({
      queryKey: badgeQueryKeys.lists(),
      queryFn: async () => {
         const { data } = await badgesService.getAll();
         return data.data;
      },
   });
}

export function useBadgeStats() {
   const query = useBadges();
   return {
      ...query,
      data: query.data ? computeBadgeStats(query.data) : undefined,
   };
}

export function useCreateBadge() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (payload: CreateBadgePayload) => {
         const { data } = await badgesService.create(payload);
         return data.data;
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: badgeQueryKeys.lists() });
      },
   });
}

export function useUpdateBadgeStatus() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (payload: UpdateBadgeStatusPayload) => {
         const { data } = await badgesService.updateStatus(payload);
         return data.data;
      },
      onSuccess: (updated: Badge) => {
         queryClient.setQueryData<Badge[]>(badgeQueryKeys.lists(), (old) =>
            old?.map((b) => (b.id === updated.id ? updated : b)),
         );
         queryClient.setQueryData(badgeQueryKeys.detail(updated.id), updated);
      },
   });
}
