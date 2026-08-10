import type { Prisma, RoleName } from '../../generated/prisma/client.js';

/**
 * Select shape used whenever the authenticated user's profile is
 * returned to the client (session hydration, GET /auth/me, etc).
 * Never includes passwordHash.
 */
export const authUserSelect = {
   id: true,
   externalSubject: true,
   firstName: true,
   lastName: true,
   email: true,
   phone: true,
   username: true,
   isActive: true,
   mustChangePassword: true,
   lastLoginAt: true,
   createdAt: true,
   employee: {
      select: {
         id: true,
         firstName: true,
         lastName: true,
         email: true,
         departmentName: true,
         position: true,
      },
   },
   userRoles: {
      select: {
         role: {
            select: {
               name: true,
               description: true,
            },
         },
      },
   },
} satisfies Prisma.UserSelect;

export type AuthUserWithRelations = Prisma.UserGetPayload<{
   select: typeof authUserSelect;
}>;

/** Credential-bearing select — local auth only; never returned to clients. */
export const localCredentialSelect = {
   id: true,
   username: true,
   passwordHash: true,
   mustChangePassword: true,
   isActive: true,
} satisfies Prisma.UserSelect;

export type LocalCredentialUser = Prisma.UserGetPayload<{
   select: typeof localCredentialSelect;
}>;

/** Shape persisted on req.session after a successful login. */
export interface SessionUser {
   userId: number;
   /** RoleName values, e.g. GUARD / RECEPTION / ADMIN / MANAGER */
   roleCodes: RoleName[];
}

/** Normalized payload returned once an SSO auth code has been exchanged. */
export interface SsoTokenPayload {
   subject: string; // matches User.externalSubject
   email: string;
}
