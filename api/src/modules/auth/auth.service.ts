import { Prisma, type RoleName } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import {
   UnauthorizedError,
   ForbiddenError,
   BadRequestError,
   ConflictError,
} from '../../lib/errors.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { destroySessionsForUser } from '../../lib/session.js';
import { authUserSelect, localCredentialSelect } from './auth.types.js';
import type {
   AuthUserWithRelations,
   LocalCredentialUser,
   SessionUser,
   SsoTokenPayload,
} from './auth.types.js';

/**
 * Exchanges the authorization code returned by the identity provider
 * for a verified subject/email pair.
 */
export const exchangeSsoCode = async (
   _code: string,
   _redirectUri: string,
): Promise<SsoTokenPayload> => {
   // TODO: call the ATI identity provider's token endpoint and verify
   // the returned id token's signature/claims.
   throw new Error('Not implemented');
};

/**
 * Resolves the local User record for a verified SSO subject. Users are
 * provisioned by admins / HR sync, not created at login time.
 * Hosts authenticate via SSO using their linked employee account.
 */
export const resolveUserBySubject = async (
   subject: string,
): Promise<AuthUserWithRelations> => {
   const user = await prisma.user.findUnique({
      where: { externalSubject: subject },
      select: authUserSelect,
   });

   if (!user) {
      throw new UnauthorizedError('Account not recognized', 'UNKNOWN_SUBJECT');
   }

   if (!user.isActive) {
      throw new ForbiddenError('Account disabled');
   }

   return user;
};

/** Local username/password verification. */
export const verifyCredentials = async (
   username: string,
   password: string,
): Promise<LocalCredentialUser> => {
   const user = await prisma.user.findUnique({
      where: { username },
      select: localCredentialSelect,
   });

   if (!user || !user.passwordHash) {
      throw new UnauthorizedError(
         'Invalid username or password',
         'INVALID_CREDENTIALS',
      );
   }

   const isMatch = await verifyPassword(password, user.passwordHash);
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

export const changePassword = async (
   userId: number,
   currentPassword: string,
   newPassword: string,
   currentSessionId?: string,
): Promise<void> => {
   const user = await prisma.user.findUnique({
      where: { id: userId },
      select: localCredentialSelect,
   });

   if (!user || !user.passwordHash) {
      throw new BadRequestError(
         'Local authentication is not enabled for this account',
      );
   }

   const isMatch = await verifyPassword(currentPassword, user.passwordHash);
   if (!isMatch) {
      throw new UnauthorizedError(
         'Current password is incorrect',
         'INVALID_CREDENTIALS',
      );
   }

   const passwordHash = await hashPassword(newPassword);

   await prisma.user.update({
      where: { id: userId },
      data: {
         passwordHash,
         mustChangePassword: false,
      },
   });

   await destroySessionsForUser(userId, currentSessionId);
};

/**
 * First-login / admin-reset password set. Requires mustChangePassword and
 * does not ask for the current (temporary) password.
 */
export const forceChangePassword = async (
   userId: number,
   newPassword: string,
   currentSessionId?: string,
): Promise<AuthUserWithRelations> => {
   const user = await prisma.user.findUnique({
      where: { id: userId },
      select: localCredentialSelect,
   });

   if (!user || !user.passwordHash) {
      throw new BadRequestError(
         'Local authentication is not enabled for this account',
      );
   }

   if (!user.mustChangePassword) {
      throw new BadRequestError('Password change is not required');
   }

   const isSamePassword = await verifyPassword(newPassword, user.passwordHash);
   if (isSamePassword) {
      throw new BadRequestError(
         'New password must be different from the current password',
      );
   }

   const passwordHash = await hashPassword(newPassword);

   await prisma.user.update({
      where: { id: userId },
      data: {
         passwordHash,
         mustChangePassword: false,
      },
   });

   await destroySessionsForUser(userId, currentSessionId);

   const updated = await getAuthUserById(userId);
   if (!updated) {
      throw new BadRequestError('User record inconsistent');
   }

   return updated;
};

export const updateProfile = async (
   userId: number,
   input: {
      firstName?: string;
      lastName?: string;
      username?: string;
      phone?: string | null;
   },
): Promise<AuthUserWithRelations> => {
   if (input.username) {
      const taken = await prisma.user.findFirst({
         where: {
            username: input.username,
            NOT: { id: userId },
         },
         select: { id: true },
      });

      if (taken) {
         throw new ConflictError('Username is already taken');
      }
   }

   try {
      return await prisma.user.update({
         where: { id: userId },
         data: {
            ...(input.firstName !== undefined && { firstName: input.firstName }),
            ...(input.lastName !== undefined && { lastName: input.lastName }),
            ...(input.username !== undefined && { username: input.username }),
            ...(input.phone !== undefined && { phone: input.phone }),
         },
         select: authUserSelect,
      });
   } catch (error) {
      const isUniqueConflict =
         error instanceof Prisma.PrismaClientKnownRequestError &&
         error.code === 'P2002';

      if (isUniqueConflict) {
         throw new ConflictError('Username is already taken');
      }

      throw error;
   }
};

export const checkUsernameAvailability = async (
   username: string,
   excludeUserId?: number,
): Promise<{ available: boolean }> => {
   const existing = await prisma.user.findFirst({
      where: {
         username,
         ...(excludeUserId !== undefined && { NOT: { id: excludeUserId } }),
      },
      select: { id: true },
   });

   return { available: !existing };
};

export const getAuthUserById = async (
   userId: number,
): Promise<AuthUserWithRelations | null> => {
   return prisma.user.findUnique({
      where: { id: userId },
      select: authUserSelect,
   });
};

export const buildSessionUser = (user: AuthUserWithRelations): SessionUser => ({
   userId: user.id,
   roleCodes: user.userRoles.map((assignment) => assignment.role.name),
});

export const formatAuthUser = (user: AuthUserWithRelations) => ({
   id: String(user.id),
   firstName: user.firstName,
   lastName: user.lastName,
   email: user.email ?? undefined,
   phone: user.phone ?? undefined,
   username: user.username ?? undefined,
   isActive: user.isActive,
   mustChangePassword: user.mustChangePassword,
   lastLoginAt: user.lastLoginAt ?? undefined,
   createdAt: user.createdAt,
   employee: user.employee
      ? {
           id: String(user.employee.id),
           firstName: user.employee.firstName,
           lastName: user.employee.lastName,
           email: user.employee.email,
           departmentName: user.employee.departmentName,
           position: user.employee.position ?? undefined,
        }
      : undefined,
   roles: user.userRoles.map(
      (assignment) => assignment.role.name,
   ) as RoleName[],
});
