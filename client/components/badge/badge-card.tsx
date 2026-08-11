'use client';

import { BadgeCardMenu } from '@/components/badge/badge-card-menu';
import { BadgeQr } from '@/components/badge/badge-qr';
import { BadgeStatusBadge } from '@/components/badge/badge-status-badge';
import type { Badge } from '@/types/badge.types';
import { CalendarClock, UserRound } from 'lucide-react';

type BadgeCardProps = {
   badge: Badge;
};

export function BadgeCard({ badge }: BadgeCardProps) {
   return (
      <div className="rounded-xl border bg-card p-4 flex flex-col gap-4 hover:shadow-sm transition-shadow">
         <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
               <p className="text-sm font-semibold tracking-tight truncate">
                  {badge.badgeNumber}
               </p>
               <p className="text-xs text-muted-foreground mt-0.5">
                  Physical visitor badge
               </p>
            </div>
            <BadgeCardMenu badge={badge} />
         </div>

         <div className="flex items-center gap-4">
            <BadgeQr value={badge.qrToken} size={72} className="shrink-0 p-1.5" />
            <div className="flex flex-col gap-2 min-w-0">
               <BadgeStatusBadge status={badge.status} />
               <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                  <UserRound className="size-3.5 shrink-0" />
                  <span className="truncate">
                     {badge.assignedTo ?? 'Unassigned'}
                  </span>
               </div>
               <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="size-3.5 shrink-0" />
                  <span>
                     {badge.lastUsedAt
                        ? `Last used ${badge.lastUsedAt}`
                        : 'Never used'}
                  </span>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-2 pt-1 border-t">
            <div className="rounded-lg bg-muted/60 px-2.5 py-2">
               <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Assigned at
               </p>
               <p className="text-xs font-medium mt-0.5 tabular-nums">
                  {badge.assignedAt ?? '—'}
               </p>
            </div>
            <div className="rounded-lg bg-muted/60 px-2.5 py-2">
               <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Last assigned
               </p>
               <p className="text-xs font-medium mt-0.5 tabular-nums">
                  {badge.lastAssignedAt ?? '—'}
               </p>
            </div>
         </div>
      </div>
   );
}
