'use client';

import { BadgeQr } from '@/components/badge/badge-qr';
import { BadgeStatusBadge } from '@/components/badge/badge-status-badge';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import type { Badge } from '@/types/badge.types';

type ViewBadgeDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   badge: Badge | null;
};

export function ViewBadgeDialog({
   open,
   onOpenChange,
   badge,
}: ViewBadgeDialogProps) {
   if (!badge) return null;

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-lg">
            <DialogHeader>
               <DialogTitle className="text-xl tracking-tight">
                  {badge.badgeNumber}
               </DialogTitle>
               <DialogDescription>
                  Badge details and assignment history
               </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col sm:flex-row gap-5 pt-1">
               <div className="flex justify-center sm:justify-start shrink-0">
                  <BadgeQr value={badge.qrToken} size={140} />
               </div>

               <div className="flex flex-col gap-3 min-w-0 flex-1 justify-center">
                  <BadgeStatusBadge status={badge.status} />
                  <div className="space-y-1.5 text-sm">
                     <p className="text-muted-foreground">
                        Current visitor:{' '}
                        <span className="text-foreground font-medium">
                           {badge.assignedTo ?? 'None'}
                        </span>
                     </p>
                     <p className="text-muted-foreground">
                        Last assigned:{' '}
                        <span className="text-foreground font-medium">
                           {badge.lastAssignedAt ?? '—'}
                        </span>
                     </p>
                     <p className="text-muted-foreground">
                        Last used:{' '}
                        <span className="text-foreground font-medium">
                           {badge.lastUsedAt ?? '—'}
                        </span>
                     </p>
                  </div>
               </div>
            </div>

            <div className="pt-2">
               <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Assignment History
               </p>

               {badge.assignmentHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center">
                     No assignment history yet.
                  </p>
               ) : (
                  <ul className="space-y-2">
                     {badge.assignmentHistory.map((entry) => (
                        <li
                           key={entry.id}
                           className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2.5"
                        >
                           <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                 {entry.visitorName}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                 {entry.visitCode}
                              </p>
                           </div>
                           <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                              {entry.assignedAt}
                           </span>
                        </li>
                     ))}
                  </ul>
               )}
            </div>
         </DialogContent>
      </Dialog>
   );
}
