'use client';

import { useQuery } from '@tanstack/react-query';
import {
   DEMO_BADGE_TOKEN,
   DEMO_PUBLIC_BADGE_INFO,
} from '@/lib/demo-public-badge';
import { publicBadgeService } from '@/services/public-badge.service';
import type { PublicBadgeInfo } from '@/types/public-badge.types';
import type { ApiErrorResponse } from '@/types/api.types';
import { AxiosError } from 'axios';

export const publicBadgeQueryKeys = {
   all: ['public-badge'] as const,
   byToken: (token: string) =>
      [...publicBadgeQueryKeys.all, 'token', token] as const,
};

export function usePublicBadgeInfo(token: string | undefined) {
   return useQuery<PublicBadgeInfo, AxiosError<ApiErrorResponse>>({
      queryKey: publicBadgeQueryKeys.byToken(token ?? ''),
      queryFn: async () => {
         if (token === DEMO_BADGE_TOKEN) {
            return DEMO_PUBLIC_BADGE_INFO;
         }

         const { data } = await publicBadgeService.getByQrToken(token!);
         return data.data;
      },
      enabled: !!token,
      retry: false,
      staleTime: 15_000,
   });
}
