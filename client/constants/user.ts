import type { BadgeProps } from '@/components/reui/badge';
import type { UserRole } from '@/types/user.types';
import {
   Shield,
   User as UserIcon,
   Briefcase,
   Headphones,
   type LucideIcon,
} from 'lucide-react';

export const USER_ROLES = ['ADMIN', 'MANAGER', 'GUARD', 'RECEPTION'] as const;

export const STAFF_ROLES: UserRole[] = [
   'ADMIN',
   'MANAGER',
   'GUARD',
   'RECEPTION',
];

export const USER_ROLE_CONFIG = {
   ADMIN: {
      label: 'Administrator',
      image: '/admin.svg',
      icon: Shield,
      color: 'text-chart-4',
      badgeVariant: 'primary-light',
   },
   MANAGER: {
      label: 'Manager',
      image: '/admin.svg',
      icon: Briefcase,
      color: 'text-chart-1',
      badgeVariant: 'info-light',
   },
   GUARD: {
      label: 'Guard',
      image: '/front_desk.svg',
      icon: UserIcon,
      color: 'text-chart-2',
      badgeVariant: 'success-light',
   },
   RECEPTION: {
      label: 'Reception',
      image: '/front_desk.svg',
      icon: Headphones,
      color: 'text-chart-3',
      badgeVariant: 'success-light',
   },
} satisfies Record<
   UserRole,
   {
      label: string;
      image: string;
      icon: LucideIcon;
      color: string;
      badgeVariant: NonNullable<BadgeProps['variant']>;
   }
>;
