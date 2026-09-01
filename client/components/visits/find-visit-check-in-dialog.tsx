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
import { ScrollArea } from '@/components/ui/scroll-area';
import { MEETING_TYPE_KEYS, useTranslation } from '@/lib/i18n';
import { canCheckIn, getCheckInEligibleVisitors } from '@/lib/visit-attendance';
import { cn } from '@/lib/utils';
import type { ManagedVisit } from '@/types/visit.types';
import { format, parseISO } from 'date-fns';
import { CalendarDays, LogIn, Search, SearchX, Users } from 'lucide-react';
import * as React from 'react';
import { ManagedVisitStatusBadge } from './managed-visit-status-badge';

type FindVisitCheckInDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   visits: ManagedVisit[];
   onSelectVisit: (visit: ManagedVisit) => void;
};

function formatTimeLabel(time: string) {
   const [hours, minutes] = time.split(':').map(Number);
   if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
   const period = hours >= 12 ? 'PM' : 'AM';
   const hour12 = hours % 12 || 12;
   return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function FindVisitCheckInDialog({
   open,
   onOpenChange,
   visits,
   onSelectVisit,
}: FindVisitCheckInDialogProps) {
   const { t } = useTranslation();
   const [query, setQuery] = React.useState('');

   React.useEffect(() => {
      if (!open) setQuery('');
   }, [open]);

   const eligibleVisits = React.useMemo(
      () => visits.filter((visit) => canCheckIn(visit)),
      [visits],
   );

   const filtered = React.useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return eligibleVisits;
      return eligibleVisits.filter((visit) => {
         return (
            visit.id.toLowerCase().includes(q) ||
            visit.visitorName.toLowerCase().includes(q) ||
            visit.host.toLowerCase().includes(q) ||
            visit.organization?.toLowerCase().includes(q) ||
            visit.visitors.some((visitor) =>
               visitor.name.toLowerCase().includes(q),
            )
         );
      });
   }, [eligibleVisits, query]);

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            className="gap-0 overflow-hidden p-0 duration-300 sm:max-w-lg"
            showCloseButton={false}
         >
            <DialogHeader className="space-y-1.5 border-b px-6 py-5 text-left">
               <DialogTitle className="text-xl font-semibold tracking-tight">
                  {t('findVisit.title')}
               </DialogTitle>
               <DialogDescription className="text-sm leading-relaxed">
                  {t('findVisit.description')}
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-6 py-5">
               <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                     value={query}
                     onChange={(event) => setQuery(event.target.value)}
                     placeholder={t('findVisit.placeholder')}
                     className="h-10 pl-9"
                     autoFocus
                  />
               </div>

               <ScrollArea className="h-[min(50vh,360px)] pr-3">
                  {filtered.length === 0 ? (
                     <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-12 text-center">
                        <SearchX className="size-8 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-foreground">
                           {t(
                              eligibleVisits.length === 0
                                 ? 'findVisit.emptyReady'
                                 : 'findVisit.emptyMatch',
                           )}
                        </p>
                        <p className="max-w-xs text-xs text-muted-foreground">
                           {t(
                              eligibleVisits.length === 0
                                 ? 'findVisit.emptyReadyHint'
                                 : 'findVisit.emptyMatchHint',
                           )}
                        </p>
                     </div>
                  ) : (
                     <div className="space-y-2">
                        {filtered.map((visit) => {
                           const eligibleCount =
                              getCheckInEligibleVisitors(visit).length;
                           const dateLabel =
                              visit.isMultiDay && visit.endDate
                                 ? `${format(parseISO(visit.startDate), 'MMM d')} – ${format(parseISO(visit.endDate), 'MMM d')}`
                                 : format(
                                      parseISO(visit.startDate),
                                      'MMM d, yyyy',
                                   );

                           return (
                              <button
                                 key={visit.id}
                                 type="button"
                                 onClick={() => {
                                    onSelectVisit(visit);
                                    onOpenChange(false);
                                 }}
                                 className={cn(
                                    'flex w-full flex-col gap-2.5 rounded-xl border bg-card p-3.5 text-left transition-colors',
                                    'hover:border-primary/40 hover:bg-primary/5',
                                 )}
                              >
                                 <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                       <p className="truncate text-sm font-semibold text-foreground">
                                          {visit.visitorName}
                                       </p>
                                       <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                          {visit.id}
                                       </p>
                                    </div>
                                    <ManagedVisitStatusBadge
                                       status={visit.status}
                                    />
                                 </div>

                                 <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <Badge
                                       variant="secondary"
                                       className="h-5 rounded-md px-1.5 font-medium"
                                    >
                                       {t(MEETING_TYPE_KEYS[visit.meetingType])}
                                    </Badge>
                                    <span className="inline-flex items-center gap-1">
                                       <CalendarDays className="size-3" />
                                       {dateLabel} ·{' '}
                                       {formatTimeLabel(visit.startTime)}–
                                       {formatTimeLabel(visit.endTime)}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                       <Users className="size-3" />
                                       {t('findVisit.readyCount', {
                                          count: eligibleCount,
                                       })}
                                    </span>
                                 </div>

                                 <div className="flex items-center justify-between gap-2 pt-0.5">
                                    <p className="truncate text-xs text-muted-foreground">
                                       {t('findVisit.hostPrefix', {
                                          name: visit.host,
                                       })}
                                       {visit.organization
                                          ? ` · ${visit.organization}`
                                          : ''}
                                    </p>
                                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                                       <LogIn className="size-3.5" />
                                       {t('visitActions.checkIn')}
                                    </span>
                                 </div>
                              </button>
                           );
                        })}
                     </div>
                  )}
               </ScrollArea>
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
               <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => onOpenChange(false)}
               >
                  {t('common.cancel')}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
   );
}
