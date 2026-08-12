import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { VisitRequestStatus } from '@/types/visit-request.types';
import { requestStatusLabels } from './visit-requests-table-filters';

const statusConfig: Record<
   VisitRequestStatus,
   { bg: string; text: string; border: string }
> = {
   pending: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
   },
   approved: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
   },
   rejected: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
   },
};

export function VisitRequestStatusBadge({
   status,
}: {
   status: VisitRequestStatus;
}) {
   const config = statusConfig[status];

   return (
      <Badge
         variant="outline"
         className={cn('py-0', config.bg, config.text, config.border)}
      >
         {requestStatusLabels[status]}
      </Badge>
   );
}

export function VisitRequestStatusPill({
   status,
}: {
   status: VisitRequestStatus;
}) {
   const config = statusConfig[status];

   return (
      <div
         className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium',
            config.bg,
            config.border,
         )}
      >
         <span className={config.text}>{requestStatusLabels[status]}</span>
      </div>
   );
}
