'use client';

import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import {
   formatVisitDuration,
   getRelevantVisitDay,
   getVisitCheckInReference,
   getVisitorAttendanceStatusForDay,
} from '@/lib/visit-attendance';
import type { ManagedVisit, ManagedVisitor } from '@/types/visit.types';
import { format } from 'date-fns';
import { Clock3, LogOut } from 'lucide-react';
import * as React from 'react';
import { VisitorAttendanceBadge } from './managed-visit-status-badge';
import { useTranslation } from '@/lib/i18n';

type CheckOutConfirmDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   visit: ManagedVisit | null;
   /** Visitors being checked out. Falls back to primary visitor when omitted. */
   visitors?: ManagedVisitor[];
   /** @deprecated Prefer `visitors`. Kept for call sites still passing names. */
   visitorNames?: string[];
   onConfirm: () => void | Promise<void>;
};

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
   onConfirm,
}: CheckOutConfirmDialogProps) {
   const { t } = useTranslation();
   const [isSubmitting, setIsSubmitting] = React.useState(false);

   React.useEffect(() => {
      if (!open) {
         setIsSubmitting(false);
      }
   }, [open]);

   const visit = visitProp;
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
         ? (selectedVisitors[0]?.name ?? t('checkOut.visitorFallback'))
         : t('visits.visitorsCount', { count: selectedVisitors.length });

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
                  {t('checkOut.title')}
               </DialogTitle>
               <DialogDescription className="text-sm leading-relaxed">
                  {t('checkOut.description')}
               </DialogDescription>
            </DialogHeader>

            {visit ? (
               <div className="space-y-4">
                  <div className="overflow-hidden rounded-xl border bg-card">
                     <div className="flex items-center justify-between gap-3 border-b px-3.5 py-2.5">
                        <p className="truncate text-xs text-muted-foreground">
                           {visit.id} ·{' '}
                           {t('findVisit.hostPrefix', { name: visit.host })}
                        </p>
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
                                             ? t('checkOut.inAt', {
                                                  time: format(
                                                     new Date(visitorCheckIn),
                                                     'HH:mm',
                                                  ),
                                               })
                                             : null,
                                       ]
                                          .filter(Boolean)
                                          .join(' · ') ||
                                          t('checkOut.visitorFallback')}
                                    </p>
                                 </div>
                                 <VisitorAttendanceBadge
                                    status={dayStatus}
                                 />
                              </li>
                           );
                        })}
                     </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="rounded-xl border bg-muted/30 px-3.5 py-3">
                        <p className="text-xs text-muted-foreground">
                           {t('checkOut.checkedInAt')}
                        </p>
                        <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                           {checkInAt ? format(checkInAt, 'HH:mm') : '—'}
                        </p>
                     </div>
                     <div className="rounded-xl border bg-muted/30 px-3.5 py-3">
                        <p className="text-xs text-muted-foreground">
                           {t('checkOut.duration')}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold tabular-nums tracking-tight">
                           <Clock3 className="size-4 text-muted-foreground" />
                           {duration}
                        </p>
                     </div>
                  </div>

                  <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                     {t('checkOut.confirmQuestion', { name: confirmLabel })}
                  </div>
               </div>
            ) : (
               <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  {t('checkOut.emptyState')}
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
                  {t('common.cancel')}
               </Button>
               <Button
                  type="button"
                  className="cursor-pointer gap-2 hover:bg-primary/90"
                  onClick={handleConfirm}
                  disabled={isSubmitting || !visit}
               >
                  <LogOut className="size-4" />
                  {isSubmitting
                     ? t('checkOut.submitting')
                     : t('checkOut.submit')}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
   );
}
