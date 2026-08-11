import type { ApiResponse } from '@/types/api.types';
import type {
   Badge,
   CreateBadgePayload,
   UpdateBadgeStatusPayload,
} from '@/types/badge.types';
import { mockBadgesStore } from '@/lib/mock-badges';

/**
 * Badge inventory service.
 * Uses an in-memory store until the badge inventory API is available.
 */
export const badgesService = {
   async getAll() {
      const data = await mockBadgesStore.list();
      return { data: { success: true, data } satisfies ApiResponse<Badge[]> };
   },

   async getById(id: number) {
      const data = await mockBadgesStore.getById(id);
      return { data: { success: true, data } satisfies ApiResponse<Badge> };
   },

   async create(payload: CreateBadgePayload) {
      try {
         const data = await mockBadgesStore.create(
            payload.badgeNumber,
            payload.qrToken,
         );
         return { data: { success: true, data } satisfies ApiResponse<Badge> };
      } catch (error) {
         const message =
            error instanceof Error ? error.message : 'Failed to create badge';
         throw {
            response: { data: { success: false, message } },
            message,
         };
      }
   },

   async updateStatus(payload: UpdateBadgeStatusPayload) {
      try {
         const data = await mockBadgesStore.updateStatus(
            payload.id,
            payload.status,
            payload.reason,
         );
         return { data: { success: true, data } satisfies ApiResponse<Badge> };
      } catch (error) {
         const message =
            error instanceof Error
               ? error.message
               : 'Failed to update badge status';
         throw {
            response: { data: { success: false, message } },
            message,
         };
      }
   },

   suggestNextNumber() {
      return mockBadgesStore.suggestNextNumber();
   },
};
