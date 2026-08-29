import type { BadgeProps } from '@/components/reui/badge';
import { UserRole } from '@/types/user.types';
import {
   Shield,
   User as UserIcon,
   type LucideIcon,
   BriefcaseBusiness,
   ClipboardCheck,
} from 'lucide-react';

export const USER_ROLES = ['GUARD', 'RECEPTION', 'ADMIN', 'MANAGER'] as const;

export const USER_ROLE_CONFIG = {
   GUARD: {
      label: 'Guard',
      image: '/guard.svg',
      icon: Shield,
      color: 'text-chart-4',
      badgeVariant: 'primary-light',
   },
   RECEPTION: {
      label: 'Reception',
      image: '/reception.svg',
      icon: ClipboardCheck,
      color: 'text-chart-2',
      badgeVariant: 'success-light',
   },
   ADMIN: {
      label: 'Administrator',
      image: '/admin.svg',
      icon: BriefcaseBusiness,
      color: 'text-chart-3',
      badgeVariant: 'warning-light',
   },
   MANAGER: {
      label: 'Manager',
      image: '/manager.svg',
      icon: UserIcon,
      color: 'text-chart-5',
      badgeVariant: 'info-light',
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
