'use client';

import { useMemo, useState } from 'react';
import { parse } from 'date-fns';
import { Ban, CalendarDays, Clock, Search, SearchX } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { sendVisitUpdateEmail } from '@/services/visit-notification.service';
import { formatScheduleSummary } from '@/lib/host-visit-schedule';
import { CancelVisitDialog } from './cancel-visit-dialog';
import {
   HostVisitCard,
   type HostVisitCardData,
} from './host-visit-card';
import {
   VisitUpdateDetails,
   type VisitUpdateDetailsValue,
} from './visit-update-details';

type UpcomingVisitsProps = {
   visits: HostVisitCardData[];
   onReschedule: (
      visit: HostVisitCardData,
      value: VisitUpdateDetailsValue,
   ) => void;
   onCancel: (visitId: string, reason: string) => void;
};

export function UpcomingVisits({
   visits,
   onReschedule,
   onCancel,
}: UpcomingVisitsProps) {
   const [searchQuery, setSearchQuery] = useState('');
   const [rescheduleVisit, setRescheduleVisit] =
      useState<HostVisitCardData | null>(null);
   const [cancelVisit, setCancelVisit] = useState<HostVisitCardData | null>(
      null,
   );

   const filteredVisits = useMemo(() => {
      if (!searchQuery.trim()) return visits;
      const q = searchQuery.toLowerCase();
      return visits.filter(
         (visit) =>
            visit.visitorName.toLowerCase().includes(q) ||
            visit.orgName?.toLowerCase().includes(q) ||
            visit.meetingType.toLowerCase().includes(q) ||
            visit.floor?.toLowerCase().includes(q) ||
            visit.room?.toLowerCase().includes(q),
      );
   }, [searchQuery, visits]);

   return (
      <>
         <section className="w-full min-w-0 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
               <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                     <h2 className="text-xl font-semibold tracking-tight text-foreground">
                        Upcoming Visits
                     </h2>
                     <Badge className="bg-sky-200 text-sky-900 dark:bg-sky-950 dark:text-sky-200">
                        <CalendarDays className="size-3" />
                        {filteredVisits.length} upcoming
                     </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                     Approved visits scheduled with confirmed locations
                  </p>
               </div>

               <div className="relative w-full sm:w-56">
                  <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                     placeholder="Search visits..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="h-9 w-full bg-background pl-8 text-sm"
                  />
               </div>
            </div>

            <div className="space-y-1.5">
               {visits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-12 text-center">
                     <CalendarDays className="size-8 text-muted-foreground/50" />
                     <p className="text-sm font-medium text-foreground">
                        No upcoming visits
                     </p>
                     <p className="text-xs text-muted-foreground">
                        Approved visits will appear here with their locations.
                     </p>
                  </div>
               ) : filteredVisits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-12 text-center">
                     <SearchX className="size-8 text-muted-foreground/50" />
                     <p className="text-sm font-medium text-foreground">
                        No visits found
                     </p>
                     <p className="text-xs text-muted-foreground">
                        Try adjusting your search.
                     </p>
                  </div>
               ) : (
                  filteredVisits.map((visit) => (
                     <HostVisitCard
                        key={visit.id}
                        visit={visit}
                        statusLabel="Upcoming"
                        statusClassName="bg-sky-200 text-sky-900 dark:bg-sky-950 dark:text-sky-200"
                        actions={
                           <>
                              <Button
                                 variant="outline"
                                 size="sm"
                                 className="h-8 cursor-pointer gap-1.5 px-2.5 text-xs"
                                 onClick={() => setRescheduleVisit(visit)}
                              >
                                 <Clock className="size-3.5" />
                                 Reschedule
                              </Button>
                              <Button
                                 variant="outline"
                                 size="sm"
                                 className={cn(
                                    'h-8 cursor-pointer gap-1.5 px-2.5 text-xs',
                                    'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700',
                                    'dark:border-red-900/60 dark:hover:bg-red-950/40',
                                 )}
                                 onClick={() => setCancelVisit(visit)}
                              >
                                 <Ban className="size-3.5" />
                                 Cancel
                              </Button>
                           </>
                        }
                     />
                  ))
               )}
            </div>
         </section>

         <Dialog
            open={!!rescheduleVisit}
            onOpenChange={(open) => !open && setRescheduleVisit(null)}
         >
            <DialogContent
               aria-describedby={undefined}
               className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 duration-300 data-open:slide-in-from-left-8 data-closed:slide-out-to-left-8 data-open:zoom-in-100 data-closed:zoom-out-100 sm:max-w-lg [[data-slot=dialog-overlay]:has(~_&)]:duration-300"
            >
               <DialogHeader className="shrink-0 space-y-1.5 border-b px-6 py-5 text-left">
                  <DialogTitle>Reschedule Visit</DialogTitle>
               </DialogHeader>
               {rescheduleVisit && (
                  <VisitUpdateDetails
                     isMultiDay={rescheduleVisit.isMultiDay}
                     visitorName={rescheduleVisit.visitorName}
                     orgName={rescheduleVisit.orgName}
                     meetingType={rescheduleVisit.meetingType}
                     defaultDate={parse(
                        rescheduleVisit.startDate,
                        'd MMM yyyy',
                        new Date(),
                     )}
                     defaultEndDate={
                        rescheduleVisit.endDate
                           ? parse(
                                rescheduleVisit.endDate,
                                'd MMM yyyy',
                                new Date(),
                             )
                           : undefined
                     }
                     defaultStartTime={rescheduleVisit.time}
                     defaultEndTime={rescheduleVisit.endTime}
                     defaultFloor={rescheduleVisit.floor}
                     defaultRoom={rescheduleVisit.room}
                     onCancel={() => setRescheduleVisit(null)}
                     onConfirm={async (value) => {
                        const scheduleSummary = formatScheduleSummary(value);
                        const email = await sendVisitUpdateEmail({
                           visitorName: rescheduleVisit.visitorName,
                           floor: value.floor,
                           room: value.room,
                           scheduleSummary,
                        });
                        onReschedule(rescheduleVisit, value);
                        toast.success('Visit rescheduled', {
                           description: email.body,
                        });
                        setRescheduleVisit(null);
                     }}
                  />
               )}
            </DialogContent>
         </Dialog>

         <CancelVisitDialog
            visit={cancelVisit}
            open={!!cancelVisit}
            onOpenChange={(open) => !open && setCancelVisit(null)}
            onConfirm={async (reason) => {
               if (!cancelVisit) return;
               onCancel(cancelVisit.id, reason);
               toast.success('Visit cancelled', {
                  description: reason
                     ? `${cancelVisit.visitorName} has been notified. Reason: ${reason}`
                     : `${cancelVisit.visitorName} has been notified.`,
               });
            }}
         />
      </>
   );
}
