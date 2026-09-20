import type { BadgeProps } from '@/components/reui/badge';
import { UserRole } from '@/types/user.types';
import { Shield, User as UserIcon, type LucideIcon } from 'lucide-react';

export const USER_ROLES = [
   'GUARD',
   'GUARD_MANAGER',
   'ADMIN',
   'HOST',
] as const;

export const USER_ROLE_CONFIG = {
   GUARD: {
      label: 'Guard',
      image: '/circle-user.svg',
      icon: Shield,
      color: 'text-chart-2',
      badgeVariant: 'success-light',
   },
   GUARD_MANAGER: {
      label: 'Guard Manager',
      image: '/admin.svg',
      icon: Shield,
      color: 'text-chart-4',
      badgeVariant: 'primary-light',
   },
   ADMIN: {
      label: 'Administrator',
      image: '/admin.svg',
      icon: Shield,
      color: 'text-chart-4',
      badgeVariant: 'primary-light',
   },
   HOST: {
      label: 'Host',
      image: '/visitor.svg',
      icon: UserIcon,
      color: 'text-chart-2',
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
