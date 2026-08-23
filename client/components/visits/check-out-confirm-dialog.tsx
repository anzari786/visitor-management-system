'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
   formatVisitDuration,
   getCheckOutEligibleVisitors,
   getRelevantVisitDay,
   getVisitCheckInReference,
   getVisitorAttendanceStatusForDay,
} from '@/lib/visit-attendance';
import type { ManagedVisit, ManagedVisitor } from '@/types/visit.types';
import { format } from 'date-fns';
import { Clock3, LogOut, ScanLine, Search } from 'lucide-react';
import * as React from 'react';
import { VisitorAttendanceBadge } from './managed-visit-status-badge';

type CheckOutConfirmDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   visit: ManagedVisit | null;
   /** Visitors being checked out. Falls back to primary visitor when omitted. */
   visitors?: ManagedVisitor[];
   /** @deprecated Prefer `visitors`. Kept for call sites still passing names. */
   visitorNames?: string[];
   /** When true, emphasize badge find/scan entry (opened from Scan Badge). */
   scanMode?: boolean;
   onConfirm: () => void | Promise<void>;
   /** Optional lookup for temporary badge find / scan demo. */
   onLookupBadge?: (badge: string) => ManagedVisit | null;
   /** Open the shared QR scanner for badge lookup. */
   onScanBadgeRequest?: () => void;
};

function getDisplayBadge(visitors: ManagedVisitor[] = []) {
   const token = visitors.find((visitor) => visitor.badgeToken)?.badgeToken;
   if (token) return token;
   return '';
}

function resolveVisitors(
   visit: ManagedVisit | null,
   visitors?: ManagedVisitor[],
   visitorNames?: string[],
): ManagedVisitor[] {
   if (visitors && visitors.length > 0) return visitors;
   if (!visit) return [];
   if (visitorNames && visitorNames.length > 0) {
      const byName = visitorNames
         .map((name) => visit.visitors.find((v) => v.name === name))
         .filter((v): v is ManagedVisitor => Boolean(v));
      if (byName.length > 0) return byName;
   }
   const primary =
      visit.visitors.find((v) => v.name === visit.visitorName) ??
      visit.visitors[0];
   return primary ? [primary] : [];
}

export function CheckOutConfirmDialog({
   open,
   onOpenChange,
   visit: visitProp,
   visitors: visitorsProp,
   visitorNames,
   scanMode = false,
   onConfirm,
   onLookupBadge,
   onScanBadgeRequest,
}: CheckOutConfirmDialogProps) {
   const [isSubmitting, setIsSubmitting] = React.useState(false);
   const [badgeInput, setBadgeInput] = React.useState('');
   const [resolvedVisit, setResolvedVisit] =
      React.useState<ManagedVisit | null>(null);

   React.useEffect(() => {
      if (!open) {
         setBadgeInput('');
         setResolvedVisit(null);
         setIsSubmitting(false);
         return;
      }
      if (visitProp) {
         setResolvedVisit(visitProp);
         const initialVisitors = resolveVisitors(
            visitProp,
            visitorsProp,
            visitorNames,
         );
         setBadgeInput(getDisplayBadge(initialVisitors));
      } else {
         setResolvedVisit(null);
         setBadgeInput('');
      }
   }, [open, visitProp, visitorsProp, visitorNames]);

   const visit = resolvedVisit;
   const selectedVisitors = resolveVisitors(visit, visitorsProp, visitorNames);
   const attendanceDay = visit ? getRelevantVisitDay(visit) : null;
   const checkInAt = visit
      ? getVisitCheckInReference(
           visit,
           selectedVisitors.map((v) => v.id),
        )
      : null;
   const duration = checkInAt ? formatVisitDuration(checkInAt) : '—';
   const confirmLabel =
      selectedVisitors.length === 1
         ? (selectedVisitors[0]?.name ?? 'Visitor')
         : `${selectedVisitors.length} visitors`;

   const handleFind = () => {
      const found = onLookupBadge?.(badgeInput.trim());
      if (found) {
         setResolvedVisit(found);
         setBadgeInput(getDisplayBadge(getCheckOutEligibleVisitors(found)));
         return;
      }
      setResolvedVisit(null);
   };

   const handleScanBadge = () => {
      if (onScanBadgeRequest) {
         onOpenChange(false);
         onScanBadgeRequest();
         return;
      }
      const found = onLookupBadge?.(badgeInput.trim() || 'SCAN');
      if (found) {
         setResolvedVisit(found);
         setBadgeInput(getDisplayBadge(getCheckOutEligibleVisitors(found)));
      }
   };

   const handleConfirm = async () => {
      if (isSubmitting || !visit) return;
      setIsSubmitting(true);
      try {
         await onConfirm();
         onOpenChange(false);
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            className="gap-5 duration-300 sm:max-w-lg"
            showCloseButton={false}
         >
            <DialogHeader className="gap-1.5 space-y-0 text-left">
               <DialogTitle className="text-xl font-semibold tracking-tight">
                  Check Out Visitor
               </DialogTitle>
               <DialogDescription className="text-sm leading-relaxed">
                  Scan or enter the printed badge QR token to find the visitor
                  and record departure.
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
               <div className="flex gap-2">
                  <Input
                     value={badgeInput}
                     onChange={(e) => setBadgeInput(e.target.value)}
                     placeholder="Badge token from QR"
                     className="h-10"
                     onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                           e.preventDefault();
                           handleFind();
                        }
                     }}
                  />
                  <div className="group shrink-0">
                     <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-lg group-hover:-translate-y-1 transition-transform duration-200 cursor-pointer"
                        onClick={handleFind}
                     >
                        <Search size={16} />
                        Find
                     </Button>
                  </div>
               </div>

               <div className="relative flex items-center justify-center">
                  <div className="absolute inset-x-0 h-px bg-border" />
                  <span className="relative bg-background px-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                     Or
                  </span>
               </div>

               <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full gap-2"
                  onClick={handleScanBadge}
               >
                  <ScanLine className="size-4" />
                  Scan Badge QR Code
               </Button>
            </div>

            {visit ? (
               <div className="space-y-4">
                  <div className="overflow-hidden rounded-xl border bg-card">
                     <div className="flex items-center justify-between gap-3 border-b px-3.5 py-2.5">
                        <p className="truncate text-xs text-muted-foreground">
                           {visit.id} · Host {visit.host}
                        </p>
                        <Badge className="shrink-0 border-0 bg-emerald-400/15 text-emerald-700 dark:text-emerald-300">
                           Badge token
                        </Badge>
                     </div>
                     <ul className="divide-y">
                        {selectedVisitors.map((visitor) => {
                           const dayStatus = attendanceDay
                              ? getVisitorAttendanceStatusForDay(
                                   visitor,
                                   attendanceDay,
                                )
                              : visitor.attendanceStatus;
                           const visitorCheckIn = attendanceDay
                              ? (visitor.attendanceByDate?.[attendanceDay]
                                   ?.checkedInAt ?? visitor.checkedInAt)
                              : visitor.checkedInAt;

                           return (
                              <li
                                 key={visitor.id}
                                 className="flex items-start justify-between gap-3 px-3.5 py-3"
                              >
                                 <div className="min-w-0 space-y-1">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                       {visitor.name}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                       {[
                                          visitor.organization,
                                          visitor.phone,
                                          visitorCheckIn
                                             ? `In ${format(new Date(visitorCheckIn), 'HH:mm')}`
                                             : null,
                                       ]
                                          .filter(Boolean)
                                          .join(' · ') || 'Visitor'}
                                    </p>
                                 </div>
                                 <VisitorAttendanceBadge
                                    status={dayStatus}
                                    visitStatus={visit.status}
                                 />
                              </li>
                           );
                        })}
                     </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="rounded-xl border bg-muted/30 px-3.5 py-3">
                        <p className="text-xs text-muted-foreground">
                           Checked in
                        </p>
                        <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                           {checkInAt ? format(checkInAt, 'HH:mm') : '—'}
                        </p>
                     </div>
                     <div className="rounded-xl border bg-muted/30 px-3.5 py-3">
                        <p className="text-xs text-muted-foreground">
                           Duration
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold tabular-nums tracking-tight">
                           <Clock3 className="size-4 text-muted-foreground" />
                           {duration}
                        </p>
                     </div>
                  </div>

                  <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                     Are you sure you want to check out{' '}
                     <span className="font-medium text-foreground">
                        {confirmLabel}
                     </span>
                     ?
                  </div>
               </div>
            ) : (
               <div
                  className={cn(
                     'rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground',
                     scanMode && 'bg-muted/20',
                  )}
               >
                  Enter a badge token or scan a printed badge QR to find the
                  visitor.
               </div>
            )}

            <div className="flex items-center justify-end gap-2">
               <Button
                  type="button"
                  variant="ghost"
                  className="cursor-pointer"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
               >
                  Cancel
               </Button>
               <Button
                  type="button"
                  className="cursor-pointer gap-2 hover:bg-primary/90"
                  onClick={handleConfirm}
                  disabled={isSubmitting || !visit}
               >
                  <LogOut className="size-4" />
                  {isSubmitting ? 'Checking out…' : 'Confirm Check-Out'}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
   );
}
