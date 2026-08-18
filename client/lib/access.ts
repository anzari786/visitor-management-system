import { STAFF_ROLES } from '@/constants/user';
import type { AuthUser, UserRole } from '@/types/user.types';

export const ROLE_PRIORITY = [
   'ADMIN',
   'MANAGER',
   'RECEPTION',
   'GUARD',
] as const satisfies readonly UserRole[];

const HOME_PATH_BY_ROLE: Record<(typeof ROLE_PRIORITY)[number], string> = {
   ADMIN: '/dashboard',
   MANAGER: '/dashboard',
   RECEPTION: '/visits',
   GUARD: '/visits',
};

/** Path → roles that may open it. Unknown dashboard paths are denied. */
export const PAGE_ACCESS: Record<string, readonly UserRole[]> = {
   '/dashboard': STAFF_ROLES,
   '/visits': STAFF_ROLES,
   '/badge': STAFF_ROLES,
   '/visit-requests': ['ADMIN', 'MANAGER', 'RECEPTION'],
   '/departments': [],
   '/users': ['ADMIN'],
   '/settings': ['ADMIN'],
};

const RESOURCE_ALIASES: Record<string, string> = {
   users: '/users',
   settings: '/settings',
};

function toRoleList(
   roles: UserRole[] | UserRole | undefined,
): UserRole[] {
   if (roles == null) return [];
   return Array.isArray(roles) ? roles : [roles];
}

export function hasAnyRole(
   userRoles: UserRole[] | undefined,
   allowed: readonly UserRole[],
): boolean {
   if (!userRoles?.length) return false;
   return allowed.some((role) => userRoles.includes(role));
}

export function primaryRole(
   user: Pick<AuthUser, 'roles'>,
): UserRole | undefined {
   for (const role of ROLE_PRIORITY) {
      if (user.roles.includes(role)) return role;
   }
   return user.roles[0];
}

function normalizePathname(pathname: string): string {
   if (!pathname) return '/';
   if (pathname.length > 1 && pathname.endsWith('/')) {
      return pathname.slice(0, -1);
   }
   return pathname;
}

function allowedRolesForPath(
   pathname: string,
): readonly UserRole[] | undefined {
   const path = normalizePathname(pathname);

   if (Object.prototype.hasOwnProperty.call(PAGE_ACCESS, path)) {
      return PAGE_ACCESS[path];
   }

   let match: string | undefined;
   for (const key of Object.keys(PAGE_ACCESS)) {
      if (path.startsWith(`${key}/`) && (!match || key.length > match.length)) {
         match = key;
      }
   }

   return match ? PAGE_ACCESS[match] : undefined;
}

export function canAccessPath(
   roles: UserRole[] | UserRole | undefined,
   pathname: string,
): boolean {
   const allowed = allowedRolesForPath(pathname);
   if (allowed == null) return false;
   return hasAnyRole(toRoleList(roles), allowed);
}

export function canAccess(
   roles: UserRole[] | UserRole | undefined,
   resource: string,
): boolean {
   const pathname = resource.startsWith('/')
      ? resource
      : (RESOURCE_ALIASES[resource] ?? `/${resource}`);
   return canAccessPath(roles, pathname);
}

export function homePathForRoles(roles: UserRole[] | undefined): string {
   if (!roles?.length) return '/login';

   for (const role of ROLE_PRIORITY) {
      if (roles.includes(role)) {
         return HOME_PATH_BY_ROLE[role];
      }
   }

   return '/login';
}
