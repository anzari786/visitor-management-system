// TODO: Remove this entire module after SSO integration
import type { Prisma } from '../../generated/prisma/client.js';

/**
 * TEMPORARY: credential-bearing select shape, scoped to this module only.
 * The shared `authUserSelect` in the SSO auth module must never include
 * passwordHash — keeping this separate guarantees that.
 * TODO: Remove after SSO integration
 */
export const localAuthUserSelect = {
   id: true,
   username: true,
   passwordHash: true,
   mustChangePassword: true,
   isActive: true,
} satisfies Prisma.UserSelect;

export type LocalAuthUser = Prisma.UserGetPayload<{
   select: typeof localAuthUserSelect;
}>;
