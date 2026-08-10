import bcrypt from 'bcrypt';
import type { RoleName } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import {
   UnauthorizedError,
   ForbiddenError,
   BadRequestError,
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

export const formatAuthUser = (user: AuthUserWithRelations) => ({
   id: String(user.id),
   firstName: user.firstName,
   lastName: user.lastName,
   email: user.email ?? undefined,
   isActive: user.isActive,
   mustChangePassword: user.mustChangePassword,
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
