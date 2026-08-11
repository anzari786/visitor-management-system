import { BADGE_STATUS_CONFIG } from '@/constants/badge';
import { cn } from '@/lib/utils';
import type { BadgeStatus } from '@/types/badge.types';
import { Badge } from '@/components/ui/badge';

export function BadgeStatusBadge({ status }: { status: BadgeStatus }) {
   const config = BADGE_STATUS_CONFIG[status];

   return (
      <Badge
         variant="outline"
         className={cn('py-0', config.bg, config.text, config.border)}
      >
         {config.label}
      </Badge>
   );
}
