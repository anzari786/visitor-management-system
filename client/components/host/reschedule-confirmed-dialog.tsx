'use client';

import { CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogClose,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import type { HostVisitCardData } from './host-visit-card';

type RescheduleConfirmedDialogProps = {
   visit: HostVisitCardData | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
};

function formatTimeLabel(time: string) {
   const [hours, minutes] = time.split(':').map(Number);
   if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
   const period = hours >= 12 ? 'PM' : 'AM';
   const hour12 = hours % 12 || 12;
   return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function RescheduleConfirmedDialog({
   visit,
   open,
   onOpenChange,
}: RescheduleConfirmedDialogProps) {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            showCloseButton={false}
            className="duration-300 data-open:slide-in-from-top-8 data-closed:slide-out-to-top-8 data-open:zoom-in-100 data-closed:zoom-out-100 sm:max-w-md [[data-slot=dialog-overlay]:has(~_&)]:duration-300"
         >
            <div className="flex flex-col items-center gap-4 text-center">
               <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CalendarCheck size={20} />
               </div>

               <DialogHeader className="items-center">
                  <DialogTitle>Visit rescheduled</DialogTitle>
                  <DialogDescription>
                     {visit ? (
                        <>
                           <span className="font-medium text-foreground">
                              {visit.visitorName}
                           </span>
                           &apos;s visit has been updated and moved to Upcoming
                           Visits. The visitor will receive a notification.
                        </>
                     ) : (
                        'The visit has been updated and moved to Upcoming Visits.'
                     )}
                  </DialogDescription>
               </DialogHeader>

               {visit && (
                  <div className="w-full space-y-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-left">
                     <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Updated Schedule
                     </p>
                     <dl className="space-y-2 text-sm">
                        <div className="flex items-start justify-between gap-3">
                           <dt className="text-muted-foreground">Date</dt>
                           <dd className="text-right font-medium text-foreground">
                              {visit.isMultiDay && visit.endDate
                                 ? `${visit.startDate} – ${visit.endDate}`
                                 : visit.startDate}
                           </dd>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                           <dt className="text-muted-foreground">Time</dt>
                           <dd className="text-right font-medium text-foreground">
                              {formatTimeLabel(visit.time)} –{' '}
                              {formatTimeLabel(visit.endTime)}
                           </dd>
                        </div>
                        {visit.floor ? (
                           <div className="flex items-start justify-between gap-3">
                              <dt className="text-muted-foreground">Floor</dt>
                              <dd className="text-right font-medium text-foreground">
                                 {visit.floor}
                              </dd>
                           </div>
                        ) : null}
                        {visit.room ? (
                           <div className="flex items-start justify-between gap-3">
                              <dt className="text-muted-foreground">Room</dt>
                              <dd className="text-right font-medium text-foreground">
                                 {visit.room}
                              </dd>
                           </div>
                        ) : null}
                     </dl>
                  </div>
               )}

               <div className="flex w-full gap-2">
                  <DialogClose asChild>
                     <Button
                        type="button"
                        className="flex-1 cursor-pointer hover:bg-primary/80"
                     >
                        Done
                     </Button>
                  </DialogClose>
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
}
