import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import {
   BadRequestError,
   NotFoundError,
   UnauthorizedError,
} from '../lib/errors.js';
import { sendTemplatedEmail } from './email.service.js';
import { PasswordSetupInvitationEmail } from '../emails/templates/PasswordSetupInvitationEmail.js';

const SALT_ROUNDS = 12;
const TOKEN_BYTES = 32;

const hashSetupToken = (rawToken: string): string =>
   createHash('sha256').update(rawToken).digest('hex');

const getTokenExpiry = (): Date => {
   const expiresAt = new Date();
   expiresAt.setHours(
      expiresAt.getHours() + env.PASSWORD_SETUP_TOKEN_TTL_HOURS,
   );
   return expiresAt;
};

export interface PasswordSetupInvitationResult {
   expiresAt: Date;
   /** Present when SMTP is not configured (development convenience only). */
   setupToken?: string;
}

/**
 * Creates a single-use password setup token for a LOCAL user and sends
 * the invitation email when an address is available.
 */
export const sendPasswordSetupInvitation = async (
   userId: number,
): Promise<PasswordSetupInvitationResult> => {
   const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
         id: true,
         authProvider: true,
         username: true,
         firstName: true,
         lastName: true,
         email: true,
         passwordHash: true,
         isActive: true,
      },
   });

   if (!user) {
      throw new NotFoundError('User not found');
   }

   if (user.authProvider !== 'LOCAL') {
      throw new BadRequestError(
         'Password setup invitations are only available for local accounts',
         'INVALID_ACCOUNT_TYPE',
      );
   }

   if (!user.isActive) {
      throw new BadRequestError('Cannot invite an inactive user');
   }

   if (user.passwordHash) {
      throw new BadRequestError(
         'This account already has a password configured',
         'PASSWORD_ALREADY_SET',
      );
   }

   const rawToken = randomBytes(TOKEN_BYTES).toString('hex');
   const tokenHash = hashSetupToken(rawToken);
   const expiresAt = getTokenExpiry();

   await prisma.$transaction([
      prisma.passwordSetupToken.updateMany({
         where: { userId, usedAt: null },
         data: { usedAt: new Date() },
      }),
      prisma.passwordSetupToken.create({
         data: {
            userId,
            tokenHash,
            expiresAt,
         },
      }),
   ]);

   const setupUrl = `${env.CLIENT_URL}/auth/password/setup?token=${rawToken}`;
   const recipientEmail = user.email;

   if (recipientEmail) {
      await sendTemplatedEmail({
         to: recipientEmail,
         subject: 'Set up your ATI VMS password',
         text: [
            `Hi ${user.firstName},`,
            '',
            'An administrator created a local account for you on ATI VMS.',
            `Sign in username: ${user.username}`,
            '',
            `Create your password using this link (expires in ${env.PASSWORD_SETUP_TOKEN_TTL_HOURS} hours):`,
            setupUrl,
         ].join('\n'),
         react: PasswordSetupInvitationEmail({
            firstName: user.firstName,
            username: user.username!,
            setupUrl,
            expiresInHours: env.PASSWORD_SETUP_TOKEN_TTL_HOURS,
         }),
      });
   }

   return {
      expiresAt,
      setupToken: env.NODE_ENV === 'development' ? rawToken : undefined,
   };
};

/** Validates a setup token and sets the user's initial password. */
export const completePasswordSetup = async (
   rawToken: string,
   password: string,
): Promise<void> => {
   const tokenHash = hashSetupToken(rawToken);

   const tokenRecord = await prisma.passwordSetupToken.findUnique({
      where: { tokenHash },
      include: {
         user: {
            select: {
               id: true,
               authProvider: true,
               passwordHash: true,
               isActive: true,
            },
         },
      },
   });

   if (!tokenRecord || tokenRecord.usedAt) {
      throw new UnauthorizedError(
         'Invalid or expired setup link',
         'INVALID_SETUP_TOKEN',
      );
   }

   if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError(
         'Invalid or expired setup link',
         'INVALID_SETUP_TOKEN',
      );
   }

   const { user } = tokenRecord;

   if (user.authProvider !== 'LOCAL' || !user.isActive) {
      throw new UnauthorizedError(
         'Invalid or expired setup link',
         'INVALID_SETUP_TOKEN',
      );
   }

   if (user.passwordHash) {
      throw new BadRequestError(
         'This account already has a password configured',
         'PASSWORD_ALREADY_SET',
      );
   }

   const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

   await prisma.$transaction([
      prisma.user.update({
         where: { id: user.id },
         data: {
            passwordHash,
            mustChangePassword: false,
         },
      }),
      prisma.passwordSetupToken.update({
         where: { id: tokenRecord.id },
         data: { usedAt: new Date() },
      }),
      prisma.passwordSetupToken.updateMany({
         where: {
            userId: user.id,
            usedAt: null,
            id: { not: tokenRecord.id },
         },
         data: { usedAt: new Date() },
      }),
   ]);
};
