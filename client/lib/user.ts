import type { User } from '@/types/user.types';

export function getUserFullName(user: Pick<User, 'firstName' | 'lastName'>) {
   return `${user.firstName} ${user.lastName}`;
}
