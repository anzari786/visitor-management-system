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

/**
 * Badge has no dedicated status-history table (unlike Visit/Invitation)
 * — just a single freeform notes field and no "who did this" column.
 * Rather than overwrite notes on every transition, timestamped entries
 * are appended so at least a readable trail survives. This is not a
 * substitute for structured audit data; if that's needed later it
 * means adding a BadgeStatusHistory model to the schema.
 */
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
   badgeNumber?: number;
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

/**
 * Transitions a badge to ASSIGNED when it's physically handed to an
 * arriving visitor. NOTE: this only updates the badge's own status —
 * linking it to a specific VisitAttendance row (badgeId,
 * badgeAssignedAt) is the Attendance module's job; that module should
 * call this alongside writing its own check-in record.
 */
export const assignBadge = async (id: number): Promise<BadgeWithSelect> => {
   const badge = await getBadgeById(id);

   assertTransition(badge.status, ['AVAILABLE']);

   return prisma.badge.update({
      where: { id },
      data: { status: 'ASSIGNED' },
      select: badgeSelect,
   });
};

/** Returns a badge to the pool when it's handed back at check-out. */
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

export const reportBadgeDamaged = async (
   id: number,
   note?: string,
): Promise<BadgeWithSelect> => {
   const badge = await getBadgeById(id);

   assertTransition(badge.status, ['AVAILABLE', 'ASSIGNED']);

   return prisma.badge.update({
      where: { id },
      data: { status: 'DAMAGED', notes: appendNote(badge.notes, note) },
      select: badgeSelect,
   });
};

/** Brings a previously LOST/DAMAGED badge back into circulation. */
export const restoreBadge = async (
   id: number,
   note?: string,
): Promise<BadgeWithSelect> => {
   const badge = await getBadgeById(id);

   assertTransition(badge.status, ['LOST', 'DAMAGED']);

   return prisma.badge.update({
      where: { id },
      data: { status: 'AVAILABLE', notes: appendNote(badge.notes, note) },
      select: badgeSelect,
   });
};

/** Terminal — a retired badge is permanently withdrawn from the pool. */
export const retireBadge = async (
   id: number,
   note?: string,
): Promise<BadgeWithSelect> => {
   const badge = await getBadgeById(id);

   assertTransition(badge.status, ['AVAILABLE', 'ASSIGNED', 'LOST', 'DAMAGED']);

   return prisma.badge.update({
      where: { id },
      data: { status: 'RETIRED', notes: appendNote(badge.notes, note) },
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
