'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

const statusStyles = {
   active: {
      labelKey: 'status.active',
      bg: 'bg-emerald-400/15 dark:bg-emerald-400/10',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
   },
   inactive: {
      labelKey: 'status.inactive',
      bg: 'bg-red-400/15 dark:bg-red-400/10',
      text: 'text-red-700 dark:text-red-300',
      dot: 'bg-red-500',
   },
} as const;

export function UserStatusBadge({
   isActive,
   className,
}: {
   isActive: boolean;
   className?: string;
}) {
   const { t } = useTranslation();
   const styles = isActive ? statusStyles.active : statusStyles.inactive;

   return (
      <Badge
         variant="outline"
         className={cn(
            'h-6 gap-1.5 rounded-md border-0 px-2 py-0 font-medium whitespace-nowrap',
            styles.bg,
            styles.text,
            className,
         )}
      >
         <span className={cn('size-1.5 rounded-full', styles.dot)} />
         {t(styles.labelKey)}
      </Badge>
   );
}
