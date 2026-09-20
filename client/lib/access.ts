import { UserRole } from '@/types/user.types';

// Maps resource keys to the roles that can access them.

// Add new resources here as the app grows.
const ACCESS_MAP: Record<string, UserRole[]> = {
   users: ['ADMIN'],
   settings: ['ADMIN'],
};

export function canAccess(role: UserRole, resource: string): boolean {
   const allowed = ACCESS_MAP[resource];
   // If resource has no restriction, all authenticated users can access it
   if (!allowed) return true;
   return allowed.includes(role);
}
