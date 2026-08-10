import type { BadgeStatus } from '@/types/badge.types';

export const BADGE_STATUS_CONFIG: Record<
   BadgeStatus,
   {
      label: string;
      bg: string;
      text: string;
      border: string;
      variant:
         | 'success-light'
         | 'info-light'
         | 'destructive-light'
         | 'secondary';
   }
> = {
   available: {
      label: 'Available',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      variant: 'success-light',
   },
   assigned: {
      label: 'Assigned',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      variant: 'info-light',
   },
   lost: {
      label: 'Lost',
      bg: 'bg-red-50 dark:bg-red-950/30',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      variant: 'destructive-light',
   },
   inactive: {
      label: 'Inactive',
      bg: 'bg-zinc-100 dark:bg-zinc-800/50',
      text: 'text-zinc-600 dark:text-zinc-400',
      border: 'border-zinc-200 dark:border-zinc-700',
      variant: 'secondary',
   },
};
