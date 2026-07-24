import { prisma } from '../../config/prisma.js';
import { UnauthorizedError, ForbiddenError } from '../../lib/errors.js';
import { authUserSelect } from './auth.types.js';
import type {
   AuthUserWithRelations,
   SessionUser,
   SsoTokenPayload,
} from './auth.types.js';

/**
 * Exchanges the authorization code returned by the identity provider
 * for a verified subject/email pair. Delegates to the IdP client —
 * kept as a boundary so the module stays testable/mockable.
 */
export const exchangeSsoCode = async (
   code: string,
   redirectUri: string,
): Promise<SsoTokenPayload> => {
   // TODO: call the ATI identity provider's token endpoint and verify
   // the returned id token's signature/claims.
   throw new Error('Not implemented');
};

/**
 * Resolves the local User record for a verified SSO subject. Users are
 * provisioned via HR/directory sync, not created at login time — an
 * unknown subject means the person isn't recognized yet.
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
   roleCodes: user.roleAssignments.map((assignment) => assignment.role.code),
});

export const formatAuthUser = (user: AuthUserWithRelations) => ({
   id: String(user.id),
   isActive: user.isActive,
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
   roles: user.roleAssignments.map((assignment) => assignment.role.code),
});
