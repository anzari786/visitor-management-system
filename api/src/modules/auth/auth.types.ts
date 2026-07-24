import type { Prisma } from '../../generated/prisma/client.js';

/**
 * Select shape used whenever the authenticated user's profile is
 * returned to the client (session hydration, GET /auth/me, etc).
 */
export const authUserSelect = {
   id: true,
   externalSubject: true,
   isActive: true,
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
   roleAssignments: {
      select: {
         role: {
            select: {
               code: true,
               name: true,
            },
         },
      },
   },
} satisfies Prisma.UserSelect;

export type AuthUserWithRelations = Prisma.UserGetPayload<{
   select: typeof authUserSelect;
}>;

/** Shape persisted on req.session after a successful SSO login. */
export interface SessionUser {
   userId: number;
   roleCodes: string[];
}

/** Normalized payload returned once an SSO auth code has been exchanged. */
export interface SsoTokenPayload {
   subject: string; // matches User.externalSubject
   email: string;
}
