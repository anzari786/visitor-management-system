import type { BadgeProps } from '@/components/reui/badge';
import { UserRole } from '@/types/user.types';
import {
   Shield,
   User as UserIcon,
   type LucideIcon,
   BriefcaseBusiness,
} from 'lucide-react';

export const USER_ROLES = [
   'GUARD',
   'GUARD_MANAGER',
   'ADMIN',
   'HOST',
] as const;

export const USER_ROLE_CONFIG = {
   GUARD: {
      label: 'Guard',
      icon: Shield,
      color: 'text-chart-2',
      badgeVariant: 'success-light',
   },
   GUARD_MANAGER: {
      label: 'Guard Manager',
      icon: Shield,
      color: 'text-chart-4',
      badgeVariant: 'primary-light',
   },
   ADMIN: {
      label: 'Administrator',
      icon: BriefcaseBusiness,
      color: 'text-chart-3',
      badgeVariant: 'warning-light',
   },
   HOST: {
      label: 'Host',
      icon: UserIcon,
      color: 'text-chart-2',
      badgeVariant: 'success-light',
   },
} satisfies Record<
   UserRole,
   {
      label: string;
      icon: LucideIcon;
      color: string;
      badgeVariant: NonNullable<BadgeProps['variant']>;
   }
>;
