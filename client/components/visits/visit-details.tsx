'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
   Field,
   FieldGroup,
   FieldLabel,
   FieldTitle,
} from '@/components/ui/field';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
   Sheet,
   SheetClose,
   SheetContent,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from '@/components/ui/sheet';
import { getMeetingTypeLabel } from '@/constants/meeting-types';
import { ID_TYPE_OPTIONS } from '@/constants/visit';
import {
   applyVisitorAttendance,
   canCheckIn,
   canCheckOut,
   getActiveVisitDay,
   getCheckInEligibleVisitors,
   getCheckOutEligibleVisitors,
   getRelevantVisitDay,
   getVisitorAttendanceStatusForDay,
   isGroupVisit,
   isVisitAttendanceWindowOpen,
   syncVisitAttendanceForDay,
} from '@/lib/visit-attendance';
import { cn } from '@/lib/utils';
import { sendPendingApprovalReminderEmail } from '@/services/visit-notification.service';
import type { IdType, ManagedVisit, ManagedVisitor } from '@/types/visit.types';
import { format, parseISO } from 'date-fns';
import {
   Building2,
   CalendarDays,
   Clock3,
   FileText,
   Hash,
   IdCard,
   Loader2,
   LogIn,
   LogOut,
   Mail,
   MapPin,
   Phone,
   Sparkles,
   Users,
   XIcon,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { CheckInDialog } from './check-in-dialog';
import { CheckInSuccessDialog } from './check-in-success-dialog';
import { CheckOutConfirmDialog } from './check-out-confirm-dialog';
import { CheckOutSuccessDialog } from './check-out-success-dialog';
import {
   ManagedVisitStatusBadge,
   VisitorAttendanceBadge,
} from './managed-visit-status-badge';

type VisitDetailsSheetProps = {
   visit: ManagedVisit | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onVisitChange: (visit: ManagedVisit) => void;
   initialMode?: 'view' | 'check_in' | 'check_out';
};

function formatTimeLabel(time: string) {
   const [hours, minutes] = time.split(':').map(Number);
   if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
   const period = hours >= 12 ? 'PM' : 'AM';
   const hour12 = hours % 12 || 12;
   return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function formatIdType(idType: IdType) {
   return (
      ID_TYPE_OPTIONS.find((option) => option.value === idType)?.label ??
      idType
         .split('_')
         .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
         .join(' ')
   );
}

function DetailRow({
   icon: Icon,
   label,
   value,
}: {
   icon: React.ElementType;
   label: string;
   value: React.ReactNode;
}) {
   if (value === null || value === undefined || value === '') return null;

   return (
      <div className="flex items-start justify-between gap-4">
         <div className="flex items-center gap-2.5 text-muted-foreground">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
               <Icon className="size-4" />
            </div>
            <span className="text-sm">{label}</span>
         </div>
         <div className="max-w-[60%] text-right text-sm font-medium text-foreground">
            {value}
         </div>
      </div>
   );
}

function VisitorDetails({ visitor }: { visitor: ManagedVisitor }) {
   return (
      <div className="flex min-w-0 flex-col items-start gap-1">
         <span className="text-sm font-medium text-foreground">
            {visitor.name}
         </span>
         <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            {visitor.phone && (
               <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3 shrink-0" />
                  {visitor.phone}
               </span>
            )}
            {visitor.email && (
               <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Mail className="size-3 shrink-0" />
                  <span className="truncate">{visitor.email}</span>
               </span>
            )}
            {(visitor.idType || visitor.idNumber) && (
               <span className="inline-flex min-w-0 items-center gap-1.5">
                  <IdCard className="size-3 shrink-0" />
                  <span className="truncate">
                     {visitor.idType ? formatIdType(visitor.idType) : 'ID'}
                     {visitor.idNumber ? ` · ${visitor.idNumber}` : ''}
                  </span>
               </span>
            )}
         </div>
      </div>
   );
}

export function VisitDetailsSheet({
   visit,
   open,
   onOpenChange,
   onVisitChange,
   initialMode = 'view',
}: VisitDetailsSheetProps) {
   const [selectedIds, setSelectedIds] = React.useState<Record<string, boolean>>(
      {},
   );
   const [checkOutConfirmOpen, setCheckOutConfirmOpen] = React.useState(false);
   const [checkOutSuccessOpen, setCheckOutSuccessOpen] = React.useState(false);
   const [checkInDialogOpen, setCheckInDialogOpen] = React.useState(false);
   const [checkInSuccessOpen, setCheckInSuccessOpen] = React.useState(false);
   const [successLabel, setSuccessLabel] = React.useState('');
   const [pendingCheckOutIds, setPendingCheckOutIds] = React.useState<string[]>(
      [],
   );
   const [pendingCheckInIds, setPendingCheckInIds] = React.useState<string[]>(
      [],
   );
   const [isResending, setIsResending] = React.useState(false);

   React.useEffect(() => {
      if (!visit || !open) return;

      const defaults: Record<string, boolean> = {};
      if (initialMode === 'check_in') {
         getCheckInEligibleVisitors(visit).forEach((v) => {
            defaults[v.id] = true;
         });
      } else if (initialMode === 'check_out') {
         getCheckOutEligibleVisitors(visit).forEach((v) => {
            defaults[v.id] = true;
         });
      } else if (!isGroupVisit(visit)) {
         const eligibleIn = getCheckInEligibleVisitors(visit);
         const eligibleOut = getCheckOutEligibleVisitors(visit);
         const auto = eligibleIn[0] ?? eligibleOut[0];
         if (auto) defaults[auto.id] = true;
      }
      setSelectedIds(defaults);
   }, [visit?.id, open, initialMode]);

   if (!visit) return null;

   const attendanceDay =
      getActiveVisitDay(visit) ?? getRelevantVisitDay(visit);
   const displayVisit = syncVisitAttendanceForDay(visit, attendanceDay);
   const windowOpen = isVisitAttendanceWindowOpen(visit);
   const group = isGroupVisit(visit);
   const checkInEligible = getCheckInEligibleVisitors(visit);
   const checkOutEligible = getCheckOutEligibleVisitors(visit);
   const showCheckIn = canCheckIn(visit);
   const showCheckOut = canCheckOut(visit);

   const selectedCheckInIds = checkInEligible
      .filter((v) => selectedIds[v.id])
      .map((v) => v.id);
   const selectedCheckOutIds = checkOutEligible
      .filter((v) => selectedIds[v.id])
      .map((v) => v.id);

   const dateLabel =
      visit.isMultiDay && visit.endDate
         ? `${format(parseISO(visit.startDate), 'MMM d')} – ${format(parseISO(visit.endDate), 'MMM d, yyyy')}`
         : format(parseISO(visit.startDate), 'MMM d, yyyy');
   const timeLabel = `${formatTimeLabel(visit.startTime)} – ${formatTimeLabel(visit.endTime)}`;
   const locationLabel =
      visit.floor || visit.room
         ? [visit.floor && `Floor ${visit.floor}`, visit.room]
              .filter(Boolean)
              .join(' · ')
         : null;
   const attendanceDayLabel = format(parseISO(attendanceDay), 'MMM d');

   const checkedInCount = displayVisit.visitors.filter(
      (v) => v.attendanceStatus === 'checked_in',
   ).length;
   const checkedOutCount = displayVisit.visitors.filter(
      (v) => v.attendanceStatus === 'checked_out',
   ).length;
   const pendingCount = displayVisit.visitors.filter(
      (v) => v.attendanceStatus === 'pending',
   ).length;

   const toggleVisitor = (id: string, checked: boolean, selectable: boolean) => {
      if (!selectable) return;
      setSelectedIds((prev) => ({ ...prev, [id]: checked }));
   };

   const handleCheckIn = () => {
      const ids =
         group && selectedCheckInIds.length > 0
            ? selectedCheckInIds
            : checkInEligible.map((v) => v.id);

      if (ids.length === 0) {
         toast.error('Select at least one visitor to check in');
         return;
      }

      setPendingCheckInIds(ids);
      setCheckInDialogOpen(true);
   };

   const confirmCheckIn = (visitorIds: string[]) => {
      const ids =
         visitorIds.length > 0 ? visitorIds : pendingCheckInIds;
      if (ids.length === 0) return;

      const names = visit.visitors
         .filter((v) => ids.includes(v.id))
         .map((v) => v.name);
      const updated = applyVisitorAttendance(visit, ids, 'checked_in');
      onVisitChange(updated);
      setSelectedIds({});
      setPendingCheckInIds([]);
      setSuccessLabel(
         names.length === 1 ? names[0]! : `${names.length} visitors`,
      );
      setCheckInSuccessOpen(true);
   };

   const handleCheckOut = () => {
      const ids =
         group && selectedCheckOutIds.length > 0
            ? selectedCheckOutIds
            : checkOutEligible.map((v) => v.id);

      if (ids.length === 0) {
         toast.error('Select at least one visitor to check out');
         return;
      }

      setPendingCheckOutIds(ids);
      setCheckOutConfirmOpen(true);
   };

   const confirmCheckOut = () => {
      const ids = pendingCheckOutIds;
      if (ids.length === 0) return;

      const names = visit.visitors
         .filter((v) => ids.includes(v.id))
         .map((v) => v.name);
      const updated = applyVisitorAttendance(visit, ids, 'checked_out');
      onVisitChange(updated);
      setSelectedIds({});
      setPendingCheckOutIds([]);
      setSuccessLabel(
         names.length === 1 ? names[0]! : `${names.length} visitors`,
      );
      setCheckOutSuccessOpen(true);
   };

   const pendingCheckOutVisitors = visit.visitors.filter((v) =>
      pendingCheckOutIds.includes(v.id),
   );
   const pendingCheckInVisitors = visit.visitors.filter((v) =>
      pendingCheckInIds.includes(v.id),
   );
   const showResendApproval = visit.status === 'requested';

   const handleResendApprovalEmail = async () => {
      if (isResending) return;
      setIsResending(true);
      try {
         await sendPendingApprovalReminderEmail({
            visitorName: visit.visitorName,
            visitSummary: `${visit.id} · ${visit.meetingType}`,
         });
         toast.success('Approval email resent', {
            description: `Reminder sent for ${visit.visitorName}'s visit request.`,
         });
      } catch {
         toast.error('Could not resend email', {
            description: 'Please try again in a moment.',
         });
      } finally {
         setIsResending(false);
      }
   };

   return (
      <>
         <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
               showCloseButton={false}
               className={cn(
                  'inset-y-4 right-4 flex h-[calc(100%-2rem)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border p-0 shadow-2xl sm:max-w-md',
               )}
            >
               <SheetHeader className="flex-row items-start justify-between gap-3 space-y-0 border-b p-5 sm:p-6">
                  <div className="min-w-0 space-y-2">
                     <div className="flex flex-wrap items-center gap-2">
                        <SheetTitle className="font-mono text-base font-semibold tracking-wide">
                           {visit.id}
                        </SheetTitle>
                        <ManagedVisitStatusBadge status={displayVisit.status} />
                     </div>
                     <SheetDescription className="text-sm text-muted-foreground">
                        {visit.visitorName}
                        {group
                           ? ` · ${visit.visitorCount} visitors`
                           : visit.organization
                             ? ` · ${visit.organization}`
                             : ''}
                     </SheetDescription>
                  </div>
                  <SheetClose asChild>
                     <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0"
                     >
                        <XIcon className="size-5" />
                        <span className="sr-only">Close</span>
                     </Button>
                  </SheetClose>
               </SheetHeader>

               <ScrollArea className="min-h-0 flex-1">
                  <div className="flex flex-col gap-6 p-5 sm:p-6">
                     <section className="space-y-4">
                        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                           Visit details
                        </h3>
                        <div className="space-y-3.5">
                           <DetailRow
                              icon={Hash}
                              label="Visit ID"
                              value={
                                 <span className="font-mono text-xs">
                                    {visit.id}
                                 </span>
                              }
                           />
                           <DetailRow
                              icon={Building2}
                              label="Organization"
                              value={
                                 visit.organization ?? 'Individual visitor'
                              }
                           />
                           <DetailRow
                              icon={Users}
                              label="Host"
                              value={visit.host}
                           />
                           <DetailRow
                              icon={Building2}
                              label="Department"
                              value={visit.department}
                           />
                           <DetailRow
                              icon={Sparkles}
                              label="Meeting type"
                              value={
                                 <Badge
                                    variant="secondary"
                                    className="h-6 rounded-md px-2 font-medium"
                                 >
                                    {getMeetingTypeLabel(visit.meetingType)}
                                 </Badge>
                              }
                           />
                           <DetailRow
                              icon={FileText}
                              label="Purpose"
                              value={visit.purpose}
                           />
                           <DetailRow
                              icon={CalendarDays}
                              label="Visit date"
                              value={dateLabel}
                           />
                           <DetailRow
                              icon={Clock3}
                              label="Time"
                              value={timeLabel}
                           />
                           <DetailRow
                              icon={MapPin}
                              label="Location"
                              value={locationLabel}
                           />
                           <DetailRow
                              icon={Users}
                              label="Visitor count"
                              value={`${visit.visitorCount}${group ? ' guests' : ' guest'}`}
                           />
                        </div>
                     </section>

                     <Separator />

                     <section className="space-y-3">
                        <div className="flex items-center justify-between gap-3 pb-1">
                           <div>
                              <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                 Visitors ({visit.visitors.length})
                              </h3>
                              <p className="mt-1 text-xs text-muted-foreground">
                                 {visit.isMultiDay
                                    ? `${attendanceDayLabel}${windowOpen ? ' · open' : ''} · `
                                    : ''}
                                 {pendingCount} pending · {checkedInCount}{' '}
                                 checked in · {checkedOutCount} checked out
                              </p>
                           </div>
                           {group && (showCheckIn || showCheckOut) && (
                              <Button
                                 variant="ghost"
                                 size="sm"
                                 className="h-8 px-2 text-xs"
                                 onClick={() => {
                                    const targets = [
                                       ...checkInEligible,
                                       ...checkOutEligible,
                                    ];
                                    const allSelected = targets.every(
                                       (v) => selectedIds[v.id],
                                    );
                                    const next: Record<string, boolean> = {
                                       ...selectedIds,
                                    };
                                    targets.forEach((v) => {
                                       next[v.id] = !allSelected;
                                    });
                                    setSelectedIds(next);
                                 }}
                              >
                                 Select eligible
                              </Button>
                           )}
                        </div>

                        {visit.visitors.length === 0 ? (
                           <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                              No visitors on this visit
                           </div>
                        ) : (
                           <FieldGroup className="w-full gap-3">
                              {displayVisit.visitors.map((visitor) => {
                                 const dayStatus =
                                    getVisitorAttendanceStatusForDay(
                                       visitor,
                                       attendanceDay,
                                    );
                                 const canSelectForCheckIn =
                                    showCheckIn && dayStatus === 'pending';
                                 const canSelectForCheckOut =
                                    showCheckOut &&
                                    dayStatus === 'checked_in';
                                 const selectable =
                                    canSelectForCheckIn ||
                                    canSelectForCheckOut;
                                 const checked = Boolean(
                                    selectedIds[visitor.id],
                                 );

                                 return (
                                    <FieldLabel
                                       key={visitor.id}
                                       className={cn(
                                          'relative p-0',
                                          selectable
                                             ? 'cursor-pointer'
                                             : 'cursor-default opacity-90',
                                       )}
                                    >
                                       <Field
                                          orientation="horizontal"
                                          className={cn(
                                             'items-start gap-3',
                                             checked &&
                                                'border-primary bg-primary/5 dark:bg-primary/10',
                                          )}
                                       >
                                          <FieldTitle className="min-w-0 flex-1 items-start">
                                             <VisitorDetails
                                                visitor={visitor}
                                             />
                                          </FieldTitle>
                                          <div className="flex shrink-0 flex-col items-end gap-2.5 self-start">
                                             <VisitorAttendanceBadge
                                                status={dayStatus}
                                             />
                                             {selectable ? (
                                                <Checkbox
                                                   checked={checked}
                                                   onCheckedChange={(value) =>
                                                      toggleVisitor(
                                                         visitor.id,
                                                         !!value,
                                                         selectable,
                                                      )
                                                   }
                                                />
                                             ) : (
                                                <span className="size-4" />
                                             )}
                                          </div>
                                       </Field>
                                    </FieldLabel>
                                 );
                              })}
                           </FieldGroup>
                        )}
                     </section>
                  </div>
               </ScrollArea>

               {(showCheckIn || showCheckOut || showResendApproval) && (
                  <SheetFooter className="border-t p-5 sm:flex-row sm:p-6">
                     {showResendApproval && (
                        <Button
                           variant="outline"
                           className="h-11 flex-1 gap-2"
                           onClick={handleResendApprovalEmail}
                           disabled={isResending}
                        >
                           {isResending ? (
                              <Loader2 className="size-4 animate-spin" />
                           ) : (
                              <Mail className="size-4" />
                           )}
                           {isResending
                              ? 'Sending…'
                              : 'Resend Approval Email'}
                        </Button>
                     )}
                     {showCheckIn && (
                        <Button
                           className="h-11 flex-1 gap-2"
                           onClick={handleCheckIn}
                           disabled={
                              checkInDialogOpen ||
                              (group
                                 ? selectedCheckInIds.length === 0
                                 : checkInEligible.length === 0)
                           }
                        >
                           <LogIn className="size-4" />
                           {group
                              ? `Check In${selectedCheckInIds.length ? ` (${selectedCheckInIds.length})` : ''}`
                              : 'Check In'}
                        </Button>
                     )}
                     {showCheckOut && (
                        <Button
                           variant={showCheckIn ? 'outline' : 'default'}
                           className="h-11 flex-1 gap-2"
                           onClick={handleCheckOut}
                           disabled={
                              checkOutConfirmOpen ||
                              (group
                                 ? selectedCheckOutIds.length === 0
                                 : checkOutEligible.length === 0)
                           }
                        >
                           <LogOut className="size-4" />
                           {group
                              ? `Check Out${selectedCheckOutIds.length ? ` (${selectedCheckOutIds.length})` : ''}`
                              : 'Check Out'}
                        </Button>
                     )}
                  </SheetFooter>
               )}
            </SheetContent>
         </Sheet>

         <CheckInDialog
            open={checkInDialogOpen}
            onOpenChange={setCheckInDialogOpen}
            visit={visit}
            visitors={pendingCheckInVisitors}
            onConfirm={confirmCheckIn}
         />

         <CheckInSuccessDialog
            open={checkInSuccessOpen}
            onOpenChange={setCheckInSuccessOpen}
            visitorLabel={successLabel || visit.visitorName}
            visitId={visit.id}
         />

         <CheckOutConfirmDialog
            open={checkOutConfirmOpen}
            onOpenChange={setCheckOutConfirmOpen}
            visit={visit}
            visitors={pendingCheckOutVisitors}
            onConfirm={confirmCheckOut}
         />

         <CheckOutSuccessDialog
            open={checkOutSuccessOpen}
            onOpenChange={setCheckOutSuccessOpen}
            visitorLabel={successLabel || visit.visitorName}
            visitId={visit.id}
         />
      </>
   );
}

export default VisitDetailsSheet;
