import type { AuthUser, UserRole } from '@/types/user.types';

const ACCESS_MAP: Record<string, UserRole[]> = {
   users: ['ADMIN'],
   settings: ['ADMIN'],
};

export function hasAnyRole(
   userRoles: UserRole[] | undefined,
   allowed: UserRole[],
): boolean {
   if (!userRoles?.length) return false;
   return allowed.some((role) => userRoles.includes(role));
}

export function primaryRole(user: Pick<AuthUser, 'roles'>): UserRole | undefined {
   return user.roles[0];
}

export function canAccess(
   roles: UserRole[] | UserRole | undefined,
   resource: string,
): boolean {
   const list = roles == null ? [] : Array.isArray(roles) ? roles : [roles];
   const allowed = ACCESS_MAP[resource];
   if (!allowed) return true;
   return hasAnyRole(list, allowed);
}
