// TODO: Remove this entire module after SSO integration
import bcrypt from 'bcrypt';
import { prisma } from '../../config/prisma.js';
import {
   UnauthorizedError,
   ForbiddenError,
   BadRequestError,
} from '../../lib/errors.js';
import { localAuthUserSelect } from './local-auth.types.js';
import type { LocalAuthUser } from './local-auth.types.js';

const SALT_ROUNDS = 12;

/** TODO: Remove after SSO integration */
export const verifyCredentials = async (
   username: string,
   password: string,
): Promise<LocalAuthUser> => {
   const user = await prisma.user.findUnique({
      where: { username },
      select: localAuthUserSelect,
   });

   if (!user || !user.passwordHash) {
      throw new UnauthorizedError(
         'Invalid username or password',
         'INVALID_CREDENTIALS',
      );
   }

   const isMatch = await bcrypt.compare(password, user.passwordHash);
   if (!isMatch) {
      throw new UnauthorizedError(
         'Invalid username or password',
         'INVALID_CREDENTIALS',
      );
   }

   if (!user.isActive) {
      throw new ForbiddenError('Account disabled');
   }

   return user;
};

/** TODO: Remove after SSO integration */
export const changePassword = async (
   userId: number,
   currentPassword: string,
   newPassword: string,
): Promise<void> => {
   const user = await prisma.user.findUnique({
      where: { id: userId },
      select: localAuthUserSelect,
   });

   if (!user || !user.passwordHash) {
      throw new BadRequestError(
         'Local authentication is not enabled for this account',
      );
   }

   const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
   if (!isMatch) {
      throw new UnauthorizedError(
         'Current password is incorrect',
         'INVALID_CREDENTIALS',
      );
   }

   const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

   await prisma.user.update({
      where: { id: userId },
      data: {
         passwordHash,
         mustChangePassword: false,
         passwordChangedAt: new Date(),
      },
   });
};

/**
 * TODO: Remove after SSO integration
 * Admin/seed helper for provisioning temporary local accounts —
 * not exposed as an HTTP endpoint by default.
 */
export const setPassword = async (
   userId: number,
   plainPassword: string,
   requireChangeOnLogin = true,
) => {
   const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
   return prisma.user.update({
      where: { id: userId },
      data: {
         passwordHash,
         mustChangePassword: requireChangeOnLogin,
         passwordChangedAt: requireChangeOnLogin ? null : new Date(),
      },
   });
};
