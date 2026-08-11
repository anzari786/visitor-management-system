import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../lib/errors.js';
import {
   computeStatus,
   formatBadge,
   getSettings,
   visitInclude,
   type VisitWithRelations,
} from '../utils/visit.js';

function extractBadgeNumeric(badgeNumber: string): number | null {
   const match = badgeNumber.trim().match(/(\d+)$/);
   if (!match) return null;
   const value = Number(match[1]);
   return Number.isFinite(value) ? value : null;
}

function formatPublicBadgeInfo(
   badgeNumber: string,
   visit: VisitWithRelations,
   settings: Awaited<ReturnType<typeof getSettings>>,
) {
   const status = computeStatus(visit, settings);
   const checkedInAt = visit.checkedInAt;

   return {
      badgeNumber,
      visitor: {
         fullName: visit.visitor.fullName,
         phone: visit.visitor.phone ?? null,
         organization: null as string | null,
      },
      host: {
         name: visit.hostName,
         department: visit.department?.name ?? null,
      },
      visit: {
         purpose: null as string | null,
         date: checkedInAt.toISOString().slice(0, 10),
         startTime: checkedInAt.toISOString(),
         endTime: visit.checkedOutAt?.toISOString() ?? null,
         floor: null as string | null,
         room: null as string | null,
         status,
      },
   };
}

export type PublicBadgeInfo = ReturnType<typeof formatPublicBadgeInfo>;

/**
 * Resolve a physical badge QR token to the currently active visit assignment.
 * Returns only public-safe visitor/visit fields (no internal IDs or personal ID docs).
 */
export async function getPublicBadgeInfoByQrToken(
   rawToken: string,
): Promise<PublicBadgeInfo> {
   const qrToken = decodeURIComponent(rawToken).trim();

   if (!qrToken) {
      throw new NotFoundError('Badge not found');
   }

   const badge = await prisma.badge.findUnique({
      where: { qrToken },
      select: {
         badgeNumber: true,
         status: true,
      },
   });

   if (!badge) {
      throw new NotFoundError('Badge not found');
   }

   if (badge.status === 'lost' || badge.status === 'inactive') {
      throw new NotFoundError('This badge is not available for visitor lookup');
   }

   const settings = await getSettings();
   const numeric = extractBadgeNumeric(badge.badgeNumber);
   let visit: VisitWithRelations | null = null;

   if (numeric != null) {
      const candidate = await prisma.visit.findFirst({
         where: { badgeNumber: numeric, status: 'active' },
         include: visitInclude,
      });

      if (candidate) {
         const formatted = formatBadge(
            settings.badgePrefix,
            candidate.badgeNumber,
         ).toUpperCase();
         const inventoryLabel = badge.badgeNumber.toUpperCase();
         const numericOnly = String(numeric);

         // Accept prefix match (VMS-012) or plain numeric inventory labels (12).
         if (
            formatted === inventoryLabel ||
            inventoryLabel === numericOnly ||
            inventoryLabel.endsWith(`-${numericOnly.padStart(3, '0')}`) ||
            inventoryLabel.endsWith(`-${numericOnly}`)
         ) {
            visit = candidate;
         }
      }
   }

   if (!visit) {
      const activeVisits = await prisma.visit.findMany({
         where: { status: 'active' },
         include: visitInclude,
         take: 500,
         orderBy: { checkedInAt: 'desc' },
      });

      visit =
         activeVisits.find(
            (candidate) =>
               formatBadge(
                  settings.badgePrefix,
                  candidate.badgeNumber,
               ).toUpperCase() === badge.badgeNumber.toUpperCase(),
         ) ?? null;
   }

   if (!visit) {
      throw new NotFoundError('No active visitor assignment for this badge');
   }

   return formatPublicBadgeInfo(badge.badgeNumber, visit, settings);
}
