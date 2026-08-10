import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { ConflictError, NotFoundError } from '../lib/errors.js';
import type { CreateBadgeBody } from '../validations/badge.validation.js';

const badgeSelect = {
   id: true,
   badgeNumber: true,
   qrToken: true,
   status: true,
   notes: true,
   createdAt: true,
   updatedAt: true,
} satisfies Prisma.BadgeSelect;

export type BadgeRecord = Prisma.BadgeGetPayload<{ select: typeof badgeSelect }>;

function uniqueConflictMessage(error: Prisma.PrismaClientKnownRequestError) {
   const target = error.meta?.target;
   const fields = Array.isArray(target)
      ? target.map(String)
      : typeof target === 'string'
        ? [target]
        : [];

   if (fields.some((field) => /qr/i.test(field))) {
      return 'A badge with this QR code already exists';
   }

   return 'A badge with this number already exists';
}

export async function createBadge(input: CreateBadgeBody): Promise<BadgeRecord> {
   const badgeNumber = input.badgeNumber.trim().toUpperCase();
   const qrToken = input.qrToken.trim();

   try {
      return await prisma.badge.create({
         data: {
            badgeNumber,
            qrToken,
            notes: input.notes?.trim() || null,
         },
         select: badgeSelect,
      });
   } catch (error) {
      if (
         error instanceof Prisma.PrismaClientKnownRequestError &&
         error.code === 'P2002'
      ) {
         throw new ConflictError(uniqueConflictMessage(error));
      }
      throw error;
   }
}

export async function listBadges(filters: {
   status?: BadgeRecord['status'];
   badgeNumber?: string;
   page: number;
   limit: number;
}) {
   const where: Prisma.BadgeWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.badgeNumber && {
         badgeNumber: filters.badgeNumber.trim().toUpperCase(),
      }),
   };

   const skip = (filters.page - 1) * filters.limit;

   const [badges, total] = await Promise.all([
      prisma.badge.findMany({
         where,
         select: badgeSelect,
         orderBy: { badgeNumber: 'asc' },
         skip,
         take: filters.limit,
      }),
      prisma.badge.count({ where }),
   ]);

   return {
      badges,
      pagination: {
         page: filters.page,
         limit: filters.limit,
         total,
         totalPages: Math.max(1, Math.ceil(total / filters.limit)),
      },
   };
}

export async function getBadgeById(id: number): Promise<BadgeRecord> {
   const badge = await prisma.badge.findUnique({
      where: { id },
      select: badgeSelect,
   });

   if (!badge) {
      throw new NotFoundError('Badge not found');
   }

   return badge;
}

export function formatBadge(badge: BadgeRecord) {
   return {
      id: badge.id,
      badgeNumber: badge.badgeNumber,
      qrToken: badge.qrToken,
      status: badge.status,
      notes: badge.notes,
      createdAt: badge.createdAt,
      updatedAt: badge.updatedAt,
   };
}
