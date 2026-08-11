'use client';

import type { ReactNode } from 'react';
import { format, parse } from 'date-fns';
import { Dot, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { HostVisitCardData } from '@/types/host.types';

export type { HostVisitCardData };

type HostVisitCardProps = {
   visit: HostVisitCardData;
   statusLabel: string;
   statusClassName: string;
   actions?: ReactNode;
};

function parseVisitDate(value: string) {
   return parse(value, 'd MMM yyyy', new Date());
}

function formatTimeLabel(time: string) {
   const [hours, minutes] = time.split(':').map(Number);
   if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
   const period = hours >= 12 ? 'PM' : 'AM';
   const hour12 = hours % 12 || 12;
   return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function MetaDot() {
   return (
      <Dot
         className="size-4 shrink-0 text-muted-foreground/70"
         aria-hidden
      />
   );
}

export function HostVisitCard({
   visit,
   statusLabel,
   statusClassName,
   actions,
}: HostVisitCardProps) {
   const startDate = parseVisitDate(visit.startDate);
   const dayNumber = format(startDate, 'dd');
   const dayLabel = format(startDate, 'EEE').toUpperCase();
   const scheduleLabel = visit.isMultiDay
      ? `${visit.startDate} → ${visit.endDate}`
      : visit.startDate;
   const timeLabel = `${formatTimeLabel(visit.time)} – ${formatTimeLabel(visit.endTime)}`;
   const hasLocation = Boolean(visit.floor && visit.room);

   return (
      <article className="rounded-xl border border-border/80 bg-card transition-colors hover:bg-muted/15">
         <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-0 sm:p-0">
            <div className="flex shrink-0 items-baseline gap-1.5 sm:w-14 sm:flex-col sm:items-center sm:justify-center sm:gap-0 sm:self-stretch sm:border-r sm:border-border/70 sm:px-2 sm:py-3.5">
               <span className="text-lg font-semibold tracking-tight text-foreground tabular-nums">
                  {dayNumber}
               </span>
               <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  {dayLabel}
               </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3">
               <div className="min-w-0 space-y-2">
                  <div className="min-w-0 space-y-1">
                     <h3 className="truncate text-sm font-semibold text-foreground">
                        {visit.visitorName}
                     </h3>
                     <p className="flex min-w-0 flex-wrap items-center text-xs text-muted-foreground">
                        <span className="truncate font-medium">
                           {visit.orgName || 'Individual visitor'}
                        </span>
                        <MetaDot />
                        <span className="truncate">{scheduleLabel}</span>
                        <MetaDot />
                        <span className="truncate">{timeLabel}</span>
                        {hasLocation && (
                           <>
                              <MetaDot />
                              <span className="truncate">{visit.floor}</span>
                              <MetaDot />
                              <span className="truncate">{visit.room}</span>
                           </>
                        )}
                        {visit.isGroup && (
                           <>
                              <MetaDot />
                              <span className="inline-flex items-center gap-1">
                                 <Users className="size-3 shrink-0" />
                                 {visit.groupSize ?? 1} visitors
                              </span>
                           </>
                        )}
                     </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                     <Badge
                        className={`h-5 px-1.5 text-[11px] font-medium ${statusClassName}`}
                     >
                        {statusLabel}
                     </Badge>
                     <Badge className="h-5 bg-teal-200 px-1.5 text-[11px] font-medium text-teal-900 dark:bg-teal-950 dark:text-teal-200">
                        {visit.meetingType}
                     </Badge>
                  </div>
               </div>

               {actions ? (
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">
                     {actions}
                  </div>
               ) : null}
            </div>
         </div>
      </article>
   );
}
