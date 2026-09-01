'use client';

import { cn } from '@/lib/utils';
import { useTranslation, type TranslationKey } from '@/lib/i18n';
import { Badge } from '../ui/badge';

export type Status =
   | 'active'
   | 'completed'
   | 'cancelled'
   | 'overstay'
   | 'inactive';

const statusConfig: Record<
   Status,
   {
      labelKey: TranslationKey;
      bg: string;
      text: string;
      border: string;
   }
> = {
   active: {
      labelKey: 'statusBadge.active',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
   },
   completed: {
      labelKey: 'statusBadge.completed',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
   },
   cancelled: {
      labelKey: 'statusBadge.cancelled',
      bg: 'bg-red-50 dark:bg-red-950/30',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
   },
   inactive: {
      labelKey: 'statusBadge.inactive',
      bg: 'bg-red-50 dark:bg-red-950/30',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
   },
   overstay: {
      labelKey: 'statusBadge.overstay',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
   },
};

export function StatusBadge({ status }: { status: Status }) {
   const { t } = useTranslation();
   const config = statusConfig[status];

   return (
      <Badge
         variant="outline"
         className={cn('py-0', config.bg, config.text, config.border)}
      >
         {t(config.labelKey)}
      </Badge>
   );
}
