import type { BadgeProps } from '@/components/reui/badge';
import { UserRole } from '@/types/user.types';
import { Shield, User as UserIcon, type LucideIcon } from 'lucide-react';

export const USER_ROLES = ['admin', 'front_desk'] as const;

export const USER_ROLE_CONFIG = {
   admin: {
      label: 'Administrator',
      image: '/admin.svg',
      icon: Shield,
      color: 'text-chart-4',
      badgeVariant: 'primary-light',
   },
   front_desk: {
      label: 'Front Desk',
      image: '/front_desk.svg',
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
