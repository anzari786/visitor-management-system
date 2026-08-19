import { type BadgeStatus, Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import {
   BadRequestError,
   ConflictError,
   NotFoundError,
} from '../../lib/errors.js';
import { getSkipTake, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationParams } from '../../utils/pagination.js';
import { generateQrToken } from '../../services/qr.service.js';
import { badgeSelect } from './badge.types.js';
import type {
   BadgeWithSelect,
   CreateBadgeInput,
   UpdateBadgeInput,
} from './badge.types.js';

const assertTransition = (current: BadgeStatus, allowed: BadgeStatus[]) => {
   if (!allowed.includes(current)) {
      throw new BadRequestError(
         `Badge cannot be changed from its current status (${current})`,
      );
   }
};

const appendNote = (
   existingNotes: string | null,
   note?: string,
): string | undefined => {
   if (!note) {
      return undefined;
   }

   const entry = `[${new Date().toISOString()}] ${note}`;
   return existingNotes ? `${existingNotes}\n${entry}` : entry;
};

export const createBadge = async (
   input: CreateBadgeInput,
): Promise<BadgeWithSelect> => {
   try {
      return await prisma.badge.create({
         data: {
            badgeNumber: input.badgeNumber,
            notes: input.notes,
            qrToken: generateQrToken(),
         },
         select: badgeSelect,
      });
   } catch (error) {
      const isUniqueConflict =
         error instanceof Prisma.PrismaClientKnownRequestError &&
         error.code === 'P2002';

      if (isUniqueConflict) {
         throw new ConflictError('A badge with this number already exists');
      }

      throw error;
   }
};

interface ListBadgesFilters extends PaginationParams {
   status?: BadgeStatus;
   badgeNumber?: string;
}

export const listBadges = async (filters: ListBadgesFilters) => {
   const where: Prisma.BadgeWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.badgeNumber !== undefined && {
         badgeNumber: filters.badgeNumber,
      }),
   };

   const [badges, total] = await Promise.all([
      prisma.badge.findMany({
         where,
         select: badgeSelect,
         orderBy: { badgeNumber: 'asc' },
         ...getSkipTake(filters),
      }),
      prisma.badge.count({ where }),
   ]);

   return {
      badges,
      meta: buildPaginationMeta(filters, total),
   };
};

export const getBadgeById = async (id: number): Promise<BadgeWithSelect> => {
   const badge = await prisma.badge.findUnique({
      where: { id },
      select: badgeSelect,
   });

   if (!badge) {
      throw new NotFoundError('Badge not found');
   }

   return badge;
};

export const updateBadge = async (
   id: number,
   input: UpdateBadgeInput,
): Promise<BadgeWithSelect> => {
   await getBadgeById(id);

   return prisma.badge.update({
      where: { id },
      data: { notes: input.notes },
      select: badgeSelect,
   });
};

export const assignBadge = async (id: number): Promise<BadgeWithSelect> => {
   const badge = await getBadgeById(id);

   assertTransition(badge.status, ['AVAILABLE']);

   return prisma.badge.update({
      where: { id },
      data: { status: 'ASSIGNED' },
      select: badgeSelect,
   });
};

export const releaseBadge = async (id: number): Promise<BadgeWithSelect> => {
   const badge = await getBadgeById(id);

   assertTransition(badge.status, ['ASSIGNED']);

   return prisma.badge.update({
      where: { id },
      data: { status: 'AVAILABLE' },
      select: badgeSelect,
   });
};

export const reportBadgeLost = async (
   id: number,
   note?: string,
): Promise<BadgeWithSelect> => {
   const badge = await getBadgeById(id);

   assertTransition(badge.status, ['AVAILABLE', 'ASSIGNED']);

   return prisma.badge.update({
      where: { id },
      data: { status: 'LOST', notes: appendNote(badge.notes, note) },
      select: badgeSelect,
   });
};

export const disableBadge = async (
   id: number,
   note?: string,
): Promise<BadgeWithSelect> => {
   const badge = await getBadgeById(id);

   assertTransition(badge.status, ['AVAILABLE', 'ASSIGNED', 'LOST']);

   return prisma.badge.update({
      where: { id },
      data: { status: 'DISABLED', notes: appendNote(badge.notes, note) },
      select: badgeSelect,
   });
};

/** Brings a previously LOST/DISABLED badge back into circulation. */
export const restoreBadge = async (
   id: number,
   note?: string,
): Promise<BadgeWithSelect> => {
   const badge = await getBadgeById(id);

   assertTransition(badge.status, ['LOST', 'DISABLED']);

   return prisma.badge.update({
      where: { id },
      data: { status: 'AVAILABLE', notes: appendNote(badge.notes, note) },
      select: badgeSelect,
   });
};

export const formatBadge = (badge: BadgeWithSelect) => ({
   id: String(badge.id),
   badgeNumber: badge.badgeNumber,
   qrToken: badge.qrToken,
   status: badge.status,
   notes: badge.notes ?? undefined,
   createdAt: badge.createdAt,
   updatedAt: badge.updatedAt,
});
