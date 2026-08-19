import type { Prisma } from '../../generated/prisma/client.js';

export const badgeSelect = {
   id: true,
   badgeNumber: true,
   qrToken: true,
   status: true,
   notes: true,
   createdAt: true,
   updatedAt: true,
} satisfies Prisma.BadgeSelect;

export type BadgeWithSelect = Prisma.BadgeGetPayload<{
   select: typeof badgeSelect;
}>;

export interface CreateBadgeInput {
   badgeNumber: string;
   notes?: string;
}

export interface UpdateBadgeInput {
   notes?: string;
}
