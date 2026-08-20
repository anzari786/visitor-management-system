import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import {
   BadRequestError,
   NotFoundError,
   UnauthorizedError,
} from '../../lib/errors.js';
import type { InvitationCreated, InvitationPreview } from './visit-registration.types.js';

const TOKEN_BYTES = 32;

export const hashInvitationToken = (rawToken: string): string =>
   createHash('sha256').update(rawToken).digest('hex');

export const buildRegistrationUrl = (rawToken: string): string =>
   `${env.CLIENT_URL.replace(/\/$/, '')}/register/${rawToken}`;

export const getDefaultExpiry = (): Date => {
   const expiresAt = new Date();
   expiresAt.setHours(
      expiresAt.getHours() + env.INVITATION_TOKEN_TTL_HOURS,
   );
   return expiresAt;
};

const invitationVisitSelect = {
   id: true,
   visitCode: true,
   status: true,
   source: true,
   purpose: true,
   organization: true,
   expectedVisitorCount: true,
   floor: true,
   room: true,
   startDate: true,
   endDate: true,
   startTime: true,
   endTime: true,
   hostNameSnapshot: true,
   departmentNameSnapshot: true,
   days: {
      select: { date: true },
      orderBy: { date: 'asc' as const },
   },
   invitation: {
      select: {
         expiresAt: true,
         revokedAt: true,
      },
   },
   _count: {
      select: { participants: true },
   },
} as const;

type InvitationVisitRecord = {
   id: number;
   visitCode: string;
   status: string;
   source: string;
   purpose: string;
   organization: string | null;
   expectedVisitorCount: number;
   floor: string | null;
   room: string | null;
   startDate: Date;
   endDate: Date;
   startTime: string;
   endTime: string;
   hostNameSnapshot: string | null;
   departmentNameSnapshot: string | null;
   days: Array<{ date: Date }>;
   invitation: {
      expiresAt: Date | null;
      revokedAt: Date | null;
   } | null;
   _count: { participants: number };
};

const REGISTRATION_ELIGIBLE_STATUSES = new Set([
   'APPROVED',
   'RESCHEDULED',
   'PARTIALLY_CHECKED_IN',
   'CHECKED_IN',
   'PARTIALLY_CHECKED_OUT',
]);

const assertInvitationActive = (
   invitation: InvitationVisitRecord['invitation'],
) => {
   if (!invitation) {
      throw new NotFoundError('Invitation not found', 'INVITATION_NOT_FOUND');
   }

   if (invitation.revokedAt) {
      throw new UnauthorizedError(
         'This invitation link has been revoked',
         'INVITATION_REVOKED',
      );
   }

   if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new UnauthorizedError(
         'This invitation link has expired',
         'INVITATION_EXPIRED',
      );
   }
};

const toInvitationPreview = (
   visit: InvitationVisitRecord,
): InvitationPreview => {
   const registeredCount = visit._count.participants;
   const remainingSlots = Math.max(
      0,
      visit.expectedVisitorCount - registeredCount,
   );
   const isActive =
      REGISTRATION_ELIGIBLE_STATUSES.has(visit.status) &&
      visit.source === 'HOST_INVITATION' &&
      !visit.invitation?.revokedAt &&
      (!visit.invitation?.expiresAt ||
         visit.invitation.expiresAt >= new Date());

   return {
      visitCode: visit.visitCode,
      purpose: visit.purpose,
      organization: visit.organization ?? undefined,
      expectedVisitorCount: visit.expectedVisitorCount,
      registeredCount,
      remainingSlots,
      isFull: registeredCount >= visit.expectedVisitorCount,
      isActive,
      hostName: visit.hostNameSnapshot ?? undefined,
      departmentName: visit.departmentNameSnapshot ?? undefined,
      floor: visit.floor ?? undefined,
      room: visit.room ?? undefined,
      startDate: visit.startDate,
      endDate: visit.endDate,
      startTime: visit.startTime,
      endTime: visit.endTime,
      scheduleDates: visit.days.map((day) => day.date),
   };
};

/**
 * Creates a secure registration link for visits with unknown visitors.
 * Returns the raw token once — only the hash is persisted.
 */
export const createVisitInvitation = async (
   visitId: number,
): Promise<InvitationCreated> => {
   const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      select: { id: true, source: true },
   });

   if (!visit) {
      throw new NotFoundError('Visit not found');
   }

   if (visit.source !== 'HOST_INVITATION') {
      throw new BadRequestError(
         'Registration links are only created for host invitations',
      );
   }

   const rawToken = randomBytes(TOKEN_BYTES).toString('hex');
   const tokenHash = hashInvitationToken(rawToken);
   const expiresAt = getDefaultExpiry();

   await prisma.visitInvitation.upsert({
      where: { visitId },
      create: {
         visitId,
         tokenHash,
         expiresAt,
      },
      update: {
         tokenHash,
         expiresAt,
         revokedAt: null,
      },
   });

   return {
      registrationUrl: buildRegistrationUrl(rawToken),
      expiresAt,
      registrationToken:
         env.NODE_ENV === 'development' ? rawToken : undefined,
   };
};

export const getInvitationByToken = async (
   rawToken: string,
): Promise<{ visitId: number; preview: InvitationPreview }> => {
   const tokenHash = hashInvitationToken(rawToken.trim());

   const invitation = await prisma.visitInvitation.findUnique({
      where: { tokenHash },
      select: {
         visit: {
            select: invitationVisitSelect,
         },
      },
   });

   if (!invitation?.visit) {
      throw new NotFoundError('Invitation not found', 'INVITATION_NOT_FOUND');
   }

   assertInvitationActive(invitation.visit.invitation);

   return {
      visitId: invitation.visit.id,
      preview: toInvitationPreview(invitation.visit),
   };
};

export const resolveVisitIdFromInvitationToken = async (
   rawToken: string,
): Promise<number> => {
   const { visitId } = await getInvitationByToken(rawToken);
   return visitId;
};

export const revokeVisitInvitation = async (visitId: number): Promise<void> => {
   await prisma.visitInvitation.updateMany({
      where: { visitId, revokedAt: null },
      data: { revokedAt: new Date() },
   });
};

export const formatInvitationPreview = (preview: InvitationPreview) => ({
   visitCode: preview.visitCode,
   purpose: preview.purpose,
   organization: preview.organization,
   expectedVisitorCount: preview.expectedVisitorCount,
   registeredCount: preview.registeredCount,
   remainingSlots: preview.remainingSlots,
   isFull: preview.isFull,
   isActive: preview.isActive,
   hostName: preview.hostName,
   departmentName: preview.departmentName,
   floor: preview.floor,
   room: preview.room,
   startDate: preview.startDate,
   endDate: preview.endDate,
   startTime: preview.startTime,
   endTime: preview.endTime,
   scheduleDates: preview.scheduleDates,
});

export const formatInvitationCreated = (created: InvitationCreated) => ({
   registrationUrl: created.registrationUrl,
   expiresAt: created.expiresAt,
   registrationToken: created.registrationToken,
});
