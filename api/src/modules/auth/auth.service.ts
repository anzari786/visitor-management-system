import bcrypt from 'bcrypt';

import { AuthProvider, type RoleName } from '../../generated/prisma/client.js';

import { prisma } from '../../config/prisma.js';

import {
   UnauthorizedError,
   ForbiddenError,
   BadRequestError,
   ConflictError,
} from '../../lib/errors.js';

import { authUserSelect, localCredentialSelect } from './auth.types.js';

import type {
   AuthUserWithRelations,
   LocalCredentialUser,
   SessionUser,
   SsoTokenPayload,
} from './auth.types.js';

const SALT_ROUNDS = 12;

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

 * Resolves an SSO user by verified IdP subject, or links a pending

 * admin-provisioned SSO account when the verified email matches the

 * linked active employee record.

 */

export const resolveOrLinkSsoUser = async (
   ssoToken: SsoTokenPayload,
): Promise<AuthUserWithRelations> => {
   const existingBySubject = await prisma.user.findUnique({
      where: { externalSubject: ssoToken.subject },

      select: authUserSelect,
   });

   if (existingBySubject) {
      if (existingBySubject.authProvider !== AuthProvider.SSO) {
         throw new UnauthorizedError(
            'Account not recognized',

            'UNKNOWN_SUBJECT',
         );
      }

      if (!existingBySubject.isActive) {
         throw new ForbiddenError('Account disabled');
      }

      return existingBySubject;
   }

   const pendingSsoUser = await prisma.user.findFirst({
      where: {
         authProvider: AuthProvider.SSO,

         externalSubject: null,

         employee: {
            email: ssoToken.email,

            isActive: true,
         },
      },

      select: authUserSelect,
   });

   if (!pendingSsoUser) {
      throw new UnauthorizedError('Account not recognized', 'UNKNOWN_SUBJECT');
   }

   if (!pendingSsoUser.isActive) {
      throw new ForbiddenError('Account disabled');
   }

   return prisma.user.update({
      where: { id: pendingSsoUser.id },

      data: { externalSubject: ssoToken.subject },

      select: authUserSelect,
   });
};

/** Local username/password verification — LOCAL accounts with a configured password only. */

export const verifyCredentials = async (
   username: string,

   password: string,
): Promise<LocalCredentialUser> => {
   const user = await prisma.user.findUnique({
      where: { username },

      select: localCredentialSelect,
   });

   if (
      !user ||
      user.authProvider !== AuthProvider.LOCAL ||
      !user.passwordHash
   ) {
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

export const changePassword = async (
   userId: number,

   currentPassword: string,

   newPassword: string,
): Promise<void> => {
   const user = await prisma.user.findUnique({
      where: { id: userId },

      select: localCredentialSelect,
   });

   if (
      !user ||
      user.authProvider !== AuthProvider.LOCAL ||
      !user.passwordHash
   ) {
      throw new BadRequestError(
         'Local authentication is not enabled for this account',

         'INVALID_ACCOUNT_TYPE',
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
      },
   });
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

export const updateCurrentUserProfile = async (
   userId: number,
   input: {
      firstName?: string;
      lastName?: string;
      username?: string;
      phone?: string | null;
      avatar?: string | null;
   },
): Promise<AuthUserWithRelations> => {
   const data: {
      firstName?: string;
      lastName?: string;
      username?: string;
      phone?: string | null;
      avatar?: string | null;
   } = {};

   if (input.firstName !== undefined) {
      data.firstName = input.firstName.trim();
   }

   if (input.lastName !== undefined) {
      data.lastName = input.lastName.trim();
   }

   if (input.username !== undefined) {
      const normalizedUsername = input.username.trim();
      if (normalizedUsername) {
         const existingUsername = await prisma.user.findUnique({
            where: { username: normalizedUsername },
            select: { id: true },
         });

         if (existingUsername && existingUsername.id !== userId) {
            throw new ConflictError(
               'Username already exists',
               'USERNAME_EXISTS',
            );
         }

         data.username = normalizedUsername;
      }
   }

   if (input.phone !== undefined) {
      data.phone = input.phone?.trim() || null;
   }

   if (input.avatar !== undefined) {
      data.avatar = input.avatar?.trim() || null;
   }

   return prisma.user.update({
      where: { id: userId },
      data,
      select: authUserSelect,
   });
};

export const formatAuthUser = (user: AuthUserWithRelations) => ({
   id: String(user.id),

   authProvider: user.authProvider,

   firstName: user.firstName,

   lastName: user.lastName,

   email: user.email ?? undefined,

   phone: user.phone ?? undefined,

   avatar: user.avatar ?? undefined,

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

   role: user.userRoles[0]?.role.name as RoleName | undefined,

   roles: user.userRoles.map(
      (assignment) => assignment.role.name,
   ) as RoleName[],
});
