import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { PublicBadgeInfo } from '@/types/public-badge.types';

export const publicBadgeService = {
   getByQrToken(token: string) {
      return api.get<ApiResponse<PublicBadgeInfo>>('/public/badges', {
         params: { token },
      });
   },
};
