'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { QrScannerDialog } from '@/components/shared/qr-scanner-dialog';
import { ID_TYPE_OPTIONS } from '@/constants/visit';
import { getMeetingTypeLabel } from '@/constants/meeting-types';
import {
   findMockBadge,
   normalizeBadgeCode,
   resolveAvailableBadges,
} from '@/data/mock-badges';
import { cn } from '@/lib/utils';
import { visitAttendanceLookupService } from '@/services/visit-attendance-lookup.service';
import type { IdType, ManagedVisit, ManagedVisitor } from '@/types/visit.types';
import { format, parseISO } from 'date-fns';
import {
   BadgeCheck,
   Building2,
   CheckCircle2,
   ChevronRight,
   IdCard,
   LogIn,
   Mail,
   Phone,
   QrCode,
   ScanLine,
   ShieldAlert,
   ShieldCheck,
   Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { toast } from 'sonner';

const CHECK_IN_STEPS = [
   {
      id: 1,
      value: 'verify',
      title: 'Verify Identity',
      description: 'Confirm each guest',
   },
   {
      id: 2,
      value: 'badge',
      title: 'Badge Assignment',
      description: 'Assign physical badges',
   },
   {
      id: 3,
      value: 'review',
      title: 'Review & Check In',
      description: 'Confirm check-in',
   },
] as const;

export type CheckInConfirmPayload = {
   visitorIds: string[];
   badgeAssignments: Record<string, string>;
};

type CheckInDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   visit: ManagedVisit | null;
   visitors?: ManagedVisitor[];
   /** Optional desk visit list used for badge availability checks. */
   allVisits?: ManagedVisit[];
   onConfirm: (payload: CheckInConfirmPayload) => void | Promise<void>;
};

type BadgeFieldState = {
   input: string;
   error?: string;
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

function InfoRow({
   icon: Icon,
   label,
   value,
}: {
   icon: React.ElementType;
   label: string;
   value?: string | null;
}) {
   if (!value) return null;
   return (
      <div className="flex min-w-0 items-start gap-2 text-xs text-muted-foreground">
         <Icon className="mt-0.5 size-3.5 shrink-0" />
         <div className="min-w-0">
            <span className="sr-only">{label}: </span>
            <span className="break-all">{value}</span>
         </div>
      </div>
   );
}

export function CheckInDialog({
   open,
   onOpenChange,
   visit,
   visitors: visitorsProp,
   allVisits = [],
   onConfirm,
}: CheckInDialogProps) {
   const [activeStepIdx, setActiveStepIdx] = React.useState(0);
   const [isSubmitting, setIsSubmitting] = React.useState(false);
   const [verifiedIds, setVerifiedIds] = React.useState<Record<string, boolean>>(
      {},
   );
   const [assignedBadges, setAssignedBadges] = React.useState<
      Record<string, string>
   >({});
   const [badgeFields, setBadgeFields] = React.useState<
      Record<string, BadgeFieldState>
   >({});
   /** Visitor whose badge input is active for Available Badge picks. */
   const [activeBadgeVisitorId, setActiveBadgeVisitorId] = React.useState<
      string | null
   >(null);
   const [badgeScannerVisitorId, setBadgeScannerVisitorId] = React.useState<
      string | null
   >(null);

   const visitors = React.useMemo(() => {
      if (visitorsProp && visitorsProp.length > 0) return visitorsProp;
      if (!visit) return [];
      return visit.visitors;
   }, [visit, visitorsProp]);

   React.useEffect(() => {
      if (!open) {
         setActiveStepIdx(0);
         setIsSubmitting(false);
         setVerifiedIds({});
         setAssignedBadges({});
         setBadgeFields({});
         setActiveBadgeVisitorId(null);
         setBadgeScannerVisitorId(null);
         return;
      }

      setVerifiedIds({});
      setAssignedBadges({});
      setBadgeFields(
         Object.fromEntries(
            visitors.map((visitor) => [visitor.id, { input: '' }]),
         ),
      );
      setActiveBadgeVisitorId(null);
      setActiveStepIdx(0);
   }, [open, visitors]);

   const verifiedVisitors = visitors.filter((v) => verifiedIds[v.id]);
   const readyVisitors = verifiedVisitors.filter((v) => assignedBadges[v.id]);
   const hasVerified = verifiedVisitors.length > 0;
   const canEnterStep2 = hasVerified;
   const canEnterStep3 = readyVisitors.length > 0;
   const pendingBadgeCount = verifiedVisitors.length - readyVisitors.length;
   const isLastStep = activeStepIdx === CHECK_IN_STEPS.length - 1;

   const assignedSet = React.useMemo(
      () => new Set(Object.values(assignedBadges)),
      [assignedBadges],
   );

   const availableBadges = resolveAvailableBadges(allVisits).filter(
      (badge) => !assignedSet.has(badge.number),
   );

   const activeBadgeTargetId = React.useMemo(() => {
      if (
         activeBadgeVisitorId &&
         verifiedIds[activeBadgeVisitorId] &&
         !assignedBadges[activeBadgeVisitorId]
      ) {
         return activeBadgeVisitorId;
      }
      return (
         verifiedVisitors.find((visitor) => !assignedBadges[visitor.id])?.id ??
         null
      );
   }, [
      activeBadgeVisitorId,
      assignedBadges,
      verifiedIds,
      verifiedVisitors,
   ]);

   const selectedPoolBadgeNumber = activeBadgeTargetId
      ? normalizeBadgeCode(badgeFields[activeBadgeTargetId]?.input ?? '')
      : '';

   React.useEffect(() => {
      if (activeStepIdx !== 1) return;
      if (activeBadgeTargetId && activeBadgeTargetId !== activeBadgeVisitorId) {
         setActiveBadgeVisitorId(activeBadgeTargetId);
      }
   }, [activeStepIdx, activeBadgeTargetId, activeBadgeVisitorId]);

   const dateLabel = visit
      ? visit.isMultiDay && visit.endDate
         ? `${format(parseISO(visit.startDate), 'MMM d')} – ${format(parseISO(visit.endDate), 'MMM d, yyyy')}`
         : format(parseISO(visit.startDate), 'MMM d, yyyy')
      : '';
   const timeLabel = visit
      ? `${formatTimeLabel(visit.startTime)} – ${formatTimeLabel(visit.endTime)}`
      : '';
   const locationLabel = visit
      ? visit.floor || visit.room
         ? [visit.floor && `Floor ${visit.floor}`, visit.room]
              .filter(Boolean)
              .join(' · ')
         : null
      : null;

   const guestLabel =
      readyVisitors.length === 1
         ? (readyVisitors[0]?.name ?? 'Visitor')
         : `${readyVisitors.length} visitors`;

   const goToStep = (index: number) => {
      if (index === activeStepIdx) return;
      if (index > activeStepIdx) {
         if (index >= 1 && !canEnterStep2) {
            toast.error('Verify at least one visitor before continuing');
            return;
         }
         if (index >= 2 && !canEnterStep3) {
            toast.error(
               'Assign a badge to at least one verified visitor before review',
            );
            return;
         }
      }
      setActiveStepIdx(index);
   };

   const handleNext = () => {
      if (activeStepIdx === 0 && !canEnterStep2) {
         toast.error('Verify at least one visitor before badge assignment');
         return;
      }
      if (activeStepIdx === 1 && !canEnterStep3) {
         toast.error(
            'Assign a badge to at least one verified visitor before review',
         );
         return;
      }
      if (activeStepIdx === 1 && pendingBadgeCount > 0) {
         toast.message('Some verified visitors have no badge yet', {
            description:
               'Only visitors with assigned badges will be included in check-in.',
         });
      }
      if (activeStepIdx < CHECK_IN_STEPS.length - 1) {
         setActiveStepIdx((prev) => prev + 1);
      }
   };

   const handleBack = () => {
      if (activeStepIdx > 0) {
         setActiveStepIdx((prev) => prev - 1);
      }
   };

   const verifyVisitor = (visitorId: string) => {
      setVerifiedIds((prev) => ({ ...prev, [visitorId]: true }));
   };

   const unverifyVisitor = (visitorId: string) => {
      setVerifiedIds((prev) => {
         const next = { ...prev };
         delete next[visitorId];
         return next;
      });
      setAssignedBadges((prev) => {
         const next = { ...prev };
         delete next[visitorId];
         return next;
      });
      setBadgeFields((prev) => ({
         ...prev,
         [visitorId]: { input: prev[visitorId]?.input ?? '' },
      }));
      if (activeStepIdx > 0) {
         setActiveStepIdx(0);
      }
   };

   const setBadgeInput = (visitorId: string, value: string) => {
      setActiveBadgeVisitorId(visitorId);
      setBadgeFields((prev) => ({
         ...prev,
         [visitorId]: { input: value },
      }));
   };

   const selectAvailableBadge = (badgeNumber: string) => {
      const targetId = activeBadgeTargetId;
      if (!targetId) {
         toast.error('Focus a visitor badge field first');
         return;
      }

      setActiveBadgeVisitorId(targetId);
      setBadgeFields((prev) => ({
         ...prev,
         [targetId]: { input: badgeNumber },
      }));
   };

   const clearBadgeAssignment = (visitorId: string) => {
      setAssignedBadges((prev) => {
         const next = { ...prev };
         delete next[visitorId];
         return next;
      });
      setBadgeFields((prev) => ({
         ...prev,
         [visitorId]: { input: '' },
      }));
      setActiveBadgeVisitorId(visitorId);
   };

   const validateBadgeForVisitor = async (
      visitorId: string,
      rawValue?: string,
   ) => {
      const value = normalizeBadgeCode(
         rawValue ?? badgeFields[visitorId]?.input ?? '',
      );

      if (!value) {
         setBadgeFields((prev) => ({
            ...prev,
            [visitorId]: {
               input: prev[visitorId]?.input ?? '',
               error: 'Enter a badge number to validate',
            },
         }));
         return;
      }

      try {
         const lookup =
            await visitAttendanceLookupService.lookupBadgeAvailability(
               value,
               allVisits,
            );

         if (!lookup.available) {
            setBadgeFields((prev) => ({
               ...prev,
               [visitorId]: {
                  input: lookup.badgeNumber || value,
                  error: lookup.reason ?? 'Badge is not available',
               },
            }));
            return;
         }

         const assignedToOther = Object.entries(assignedBadges).find(
            ([id, number]) =>
               id !== visitorId &&
               normalizeBadgeCode(number) ===
                  normalizeBadgeCode(lookup.badgeNumber),
         );
         if (assignedToOther) {
            setBadgeFields((prev) => ({
               ...prev,
               [visitorId]: {
                  input: lookup.badgeNumber,
                  error: 'This badge is already assigned in this check-in',
               },
            }));
            return;
         }

         setAssignedBadges((prev) => ({
            ...prev,
            [visitorId]: lookup.badgeNumber,
         }));
         setBadgeFields((prev) => ({
            ...prev,
            [visitorId]: { input: lookup.badgeNumber },
         }));
         toast.success(`Badge ${lookup.badgeNumber} assigned`);
      } catch (error) {
         setBadgeFields((prev) => ({
            ...prev,
            [visitorId]: {
               input: value,
               error:
                  error instanceof Error
                     ? error.message
                     : 'Unable to validate badge',
            },
         }));
      }
   };

   const handleScannedBadge = React.useCallback(
      async (decodedText: string) => {
         const visitorId = badgeScannerVisitorId ?? activeBadgeTargetId;
         if (!visitorId) {
            throw new Error('Select a visitor before scanning a badge');
         }

         const lookup =
            await visitAttendanceLookupService.lookupBadgeAvailability(
               decodedText,
               allVisits,
            );

         if (!lookup.available) {
            throw new Error(lookup.reason ?? 'Badge is not available');
         }

         const assignedToOther = Object.entries(assignedBadges).find(
            ([id, number]) =>
               id !== visitorId &&
               normalizeBadgeCode(number) ===
                  normalizeBadgeCode(lookup.badgeNumber),
         );
         if (assignedToOther) {
            throw new Error('This badge is already assigned in this check-in');
         }

         setActiveBadgeVisitorId(visitorId);
         setAssignedBadges((prev) => ({
            ...prev,
            [visitorId]: lookup.badgeNumber,
         }));
         setBadgeFields((prev) => ({
            ...prev,
            [visitorId]: { input: lookup.badgeNumber },
         }));
         setBadgeScannerVisitorId(null);
         toast.success(`Badge ${lookup.badgeNumber} assigned`);
      },
      [activeBadgeTargetId, allVisits, assignedBadges, badgeScannerVisitorId],
   );

   const handleConfirm = async () => {
      if (isSubmitting || !visit || !canEnterStep3) return;
      setIsSubmitting(true);
      try {
         const badgeAssignments = Object.fromEntries(
            readyVisitors.map((visitor) => [
               visitor.id,
               assignedBadges[visitor.id]!,
            ]),
         );
         await onConfirm({
            visitorIds: readyVisitors.map((visitor) => visitor.id),
            badgeAssignments,
         });
         onOpenChange(false);
      } finally {
         setIsSubmitting(false);
      }
   };

   const continueDisabled =
      isSubmitting ||
      (activeStepIdx === 0 && !canEnterStep2) ||
      (activeStepIdx === 1 && !canEnterStep3);

   return (
      <>
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            className="gap-0 overflow-hidden p-0 duration-300 sm:max-w-4xl"
            showCloseButton={false}
         >
            <DialogHeader className="space-y-1.5 border-b px-6 py-5 text-left sm:px-8">
               <DialogTitle className="text-xl font-semibold tracking-tight">
                  Check In Visitor
               </DialogTitle>
               <DialogDescription className="text-sm leading-relaxed">
                  Verify identity, assign a physical badge, then confirm
                  check-in
                  {visit ? (
                     <>
                        {' '}
                        for{' '}
                        <span className="font-mono text-foreground">
                           {visit.id}
                        </span>
                     </>
                  ) : null}
                  . QR scanning is optional throughout this flow.
               </DialogDescription>
            </DialogHeader>

            {!visit || visitors.length === 0 ? (
               <div className="px-6 py-16 text-center text-sm text-muted-foreground sm:px-8">
                  No visitors are ready for check-in.
               </div>
            ) : (
               <Card className="rounded-none border-0 bg-background py-0! shadow-none">
                  <CardContent className="px-0 pb-0">
                     <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/5 px-6 py-5 sm:flex-row sm:items-center sm:px-8">
                        {CHECK_IN_STEPS.map((step, index) => {
                           const isActive = activeStepIdx === index;
                           const isPast = activeStepIdx > index;
                           const locked =
                              (index >= 1 && !canEnterStep2) ||
                              (index >= 2 && !canEnterStep3);

                           return (
                              <div
                                 key={step.value}
                                 className="flex flex-1 items-center gap-3 last:flex-none sm:gap-4"
                              >
                                 <button
                                    type="button"
                                    onClick={() => goToStep(index)}
                                    className={cn(
                                       'group flex items-center gap-3 text-left focus:outline-hidden sm:gap-4',
                                       locked && index > activeStepIdx
                                          ? 'cursor-not-allowed opacity-60'
                                          : 'cursor-pointer',
                                    )}
                                 >
                                    <div
                                       className={cn(
                                          'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-300',
                                          isPast
                                             ? 'bg-teal-400 text-white'
                                             : isActive
                                               ? 'bg-primary text-primary-foreground'
                                               : 'bg-muted text-muted-foreground',
                                       )}
                                    >
                                       {step.id}
                                    </div>
                                    <div className="flex min-w-0 flex-col">
                                       <span
                                          className={cn(
                                             'text-sm font-bold transition-colors',
                                             isActive
                                                ? 'text-foreground'
                                                : 'text-muted-foreground',
                                          )}
                                       >
                                          {step.title}
                                       </span>
                                       <span className="text-xs font-medium text-muted-foreground/60">
                                          {step.description}
                                       </span>
                                    </div>
                                 </button>
                                 {index < CHECK_IN_STEPS.length - 1 && (
                                    <div className="mx-auto hidden sm:block">
                                       <ChevronRight className="size-4 text-muted-foreground/40" />
                                    </div>
                                 )}
                              </div>
                           );
                        })}
                     </div>

                     <div className="max-h-[min(62vh,640px)] overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">
                        <AnimatePresence mode="wait">
                           <motion.div
                              key={activeStepIdx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-5"
                           >
                              {activeStepIdx === 0 && (
                                 <>
                                    <div className="space-y-2">
                                       <div className="flex items-center gap-2">
                                          <ShieldCheck className="size-4 text-primary" />
                                          <h3 className="text-lg font-semibold text-foreground">
                                             Verify Identity
                                          </h3>
                                       </div>
                                       <p className="text-sm leading-relaxed text-muted-foreground">
                                          Confirm each visitor&apos;s identity
                                          against their ID details. Verification
                                          is required before badge assignment.
                                       </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3.5 py-2.5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                                       <ShieldAlert className="size-4 shrink-0" />
                                       <span>
                                          Verify at least one visitor to continue.
                                          Only verified visitors move to badge
                                          assignment.
                                       </span>
                                    </div>

                                    <div className="space-y-3">
                                       {visitors.map((visitor) => {
                                          const verified = Boolean(
                                             verifiedIds[visitor.id],
                                          );
                                          return (
                                             <div
                                                key={visitor.id}
                                                className={cn(
                                                   'rounded-xl border p-4 transition-colors',
                                                   verified
                                                      ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                                                      : 'bg-card',
                                                )}
                                             >
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                                   <div className="shrink-0">
                                                      {verified ? (
                                                         <div className="flex flex-col gap-2">
                                                            <Badge className="h-9 gap-1.5 border-0 bg-emerald-500 px-3 text-sm font-semibold text-white hover:bg-emerald-500">
                                                               <CheckCircle2 className="size-4" />
                                                               Verified
                                                            </Badge>
                                                            <Button
                                                               type="button"
                                                               variant="ghost"
                                                               size="sm"
                                                               className="h-7 px-2 text-xs text-muted-foreground"
                                                               onClick={() =>
                                                                  unverifyVisitor(
                                                                     visitor.id,
                                                                  )
                                                               }
                                                            >
                                                               Undo
                                                            </Button>
                                                         </div>
                                                      ) : (
                                                         <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-9 gap-2"
                                                            onClick={() =>
                                                               verifyVisitor(
                                                                  visitor.id,
                                                               )
                                                            }
                                                         >
                                                            <ShieldCheck className="size-4" />
                                                            Verify Identity
                                                         </Button>
                                                      )}
                                                   </div>

                                                   <div className="min-w-0 flex-1 space-y-3">
                                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                                         <div>
                                                            <p className="text-sm font-semibold text-foreground">
                                                               {visitor.name}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                               {visitor.organization ||
                                                                  'Individual visitor'}
                                                            </p>
                                                         </div>
                                                         {!verified && (
                                                            <Badge
                                                               variant="secondary"
                                                               className="h-5 rounded-md px-1.5 text-[11px]"
                                                            >
                                                               Not Verified
                                                            </Badge>
                                                         )}
                                                      </div>

                                                      <div className="grid gap-2 sm:grid-cols-2">
                                                         <InfoRow
                                                            icon={Phone}
                                                            label="Phone"
                                                            value={visitor.phone}
                                                         />
                                                         <InfoRow
                                                            icon={Mail}
                                                            label="Email"
                                                            value={visitor.email}
                                                         />
                                                         <InfoRow
                                                            icon={Building2}
                                                            label="Organization"
                                                            value={
                                                               visitor.organization
                                                            }
                                                         />
                                                         <InfoRow
                                                            icon={IdCard}
                                                            label="ID"
                                                            value={
                                                               visitor.idType ||
                                                               visitor.idNumber
                                                                  ? [
                                                                       visitor.idType
                                                                          ? formatIdType(
                                                                               visitor.idType,
                                                                            )
                                                                          : null,
                                                                       visitor.idNumber,
                                                                    ]
                                                                       .filter(
                                                                          Boolean,
                                                                       )
                                                                       .join(
                                                                          ' · ',
                                                                       )
                                                                  : 'ID not provided'
                                                            }
                                                         />
                                                      </div>
                                                   </div>
                                                </div>
                                             </div>
                                          );
                                       })}
                                    </div>
                                 </>
                              )}

                              {activeStepIdx === 1 && (
                                 <>
                                    <div className="space-y-2">
                                       <div className="flex items-center gap-2">
                                          <IdCard className="size-4 text-primary" />
                                          <h3 className="text-lg font-semibold text-foreground">
                                             Physical Badge Assignment
                                          </h3>
                                       </div>
                                       <p className="text-sm leading-relaxed text-muted-foreground">
                                          Enter a badge number or pick one from
                                          Available Badges. Scanning a badge QR
                                          is optional.
                                       </p>
                                    </div>

                                    {verifiedVisitors.length === 0 ? (
                                       <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                                          No verified visitors yet. Go back and
                                          verify at least one guest.
                                       </div>
                                    ) : (
                                       <div className="space-y-3">
                                          {verifiedVisitors.map((visitor) => {
                                             const assigned =
                                                assignedBadges[visitor.id];
                                             const field =
                                                badgeFields[visitor.id] ?? {
                                                   input: '',
                                                };
                                             const poolBadge = assigned
                                                ? findMockBadge(assigned)
                                                : undefined;

                                             return (
                                                <div
                                                   key={visitor.id}
                                                   className={cn(
                                                      'rounded-xl border p-4 transition-colors',
                                                      assigned
                                                         ? 'border-sky-200 bg-sky-50/40 dark:border-sky-900/40 dark:bg-sky-950/20'
                                                         : activeBadgeTargetId ===
                                                             visitor.id
                                                           ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                                                           : 'bg-card',
                                                   )}
                                                >
                                                   <div className="flex flex-wrap items-start justify-between gap-3">
                                                      <div className="min-w-0">
                                                         <p className="text-sm font-semibold text-foreground">
                                                            {visitor.name}
                                                         </p>
                                                         <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {[
                                                               visitor.organization,
                                                               visitor.phone,
                                                            ]
                                                               .filter(Boolean)
                                                               .join(' · ') ||
                                                               'Verified visitor'}
                                                         </p>
                                                      </div>
                                                      {assigned ? (
                                                         <Badge className="h-6 gap-1 border-0 bg-sky-500/15 text-sky-700 dark:text-sky-300">
                                                            <BadgeCheck className="size-3.5" />
                                                            {assigned}
                                                         </Badge>
                                                      ) : (
                                                         <Badge
                                                            variant="secondary"
                                                            className="h-5 rounded-md px-1.5 text-[11px]"
                                                         >
                                                            Badge required
                                                         </Badge>
                                                      )}
                                                   </div>

                                                   {assigned && poolBadge ? (
                                                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background/80 px-3 py-2.5">
                                                         <div className="space-y-0.5">
                                                            <p className="text-xs text-muted-foreground">
                                                               Assigned badge
                                                            </p>
                                                            <p className="font-mono text-sm font-semibold text-foreground">
                                                               {poolBadge.number}
                                                            </p>
                                                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                               <QrCode className="size-3.5" />
                                                               {poolBadge.qrCode}
                                                            </p>
                                                         </div>
                                                         <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8"
                                                            onClick={() =>
                                                               clearBadgeAssignment(
                                                                  visitor.id,
                                                               )
                                                            }
                                                         >
                                                            Change
                                                         </Button>
                                                      </div>
                                                   ) : (
                                                      <div className="mt-3 space-y-2">
                                                         <div className="flex flex-col gap-2 sm:flex-row">
                                                            <Input
                                                               value={
                                                                  field.input
                                                               }
                                                               onChange={(
                                                                  event,
                                                               ) =>
                                                                  setBadgeInput(
                                                                     visitor.id,
                                                                     event
                                                                        .target
                                                                        .value,
                                                                  )
                                                               }
                                                               onFocus={() =>
                                                                  setActiveBadgeVisitorId(
                                                                     visitor.id,
                                                                  )
                                                               }
                                                               placeholder="Badge number (e.g. B-1024)"
                                                               className="h-10"
                                                               onKeyDown={(
                                                                  event,
                                                               ) => {
                                                                  if (
                                                                     event.key ===
                                                                     'Enter'
                                                                  ) {
                                                                     event.preventDefault();
                                                                     validateBadgeForVisitor(
                                                                        visitor.id,
                                                                     );
                                                                  }
                                                               }}
                                                            />
                                                            <Button
                                                               type="button"
                                                               variant="outline"
                                                               className="h-10 shrink-0 gap-2"
                                                               onClick={() =>
                                                                  validateBadgeForVisitor(
                                                                     visitor.id,
                                                                  )
                                                               }
                                                            >
                                                               <BadgeCheck className="size-4" />
                                                               Validate Badge
                                                            </Button>
                                                            <Button
                                                               type="button"
                                                               variant="outline"
                                                               className="h-10 shrink-0 gap-2"
                                                               onClick={() => {
                                                                  setActiveBadgeVisitorId(
                                                                     visitor.id,
                                                                  );
                                                                  setBadgeScannerVisitorId(
                                                                     visitor.id,
                                                                  );
                                                               }}
                                                            >
                                                               <ScanLine className="size-4" />
                                                               Scan Badge
                                                               <span className="text-[10px] font-normal text-muted-foreground">
                                                                  (optional)
                                                               </span>
                                                            </Button>
                                                         </div>
                                                         {field.error ? (
                                                            <p className="text-xs text-destructive">
                                                               {field.error}
                                                            </p>
                                                         ) : (
                                                            <p className="text-xs text-muted-foreground">
                                                               Type a badge
                                                               number, click an
                                                               Available Badge,
                                                               or optionally scan
                                                               — then validate.
                                                            </p>
                                                         )}
                                                      </div>
                                                   )}
                                                </div>
                                             );
                                          })}
                                       </div>
                                    )}

                                    <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                                       <div className="flex items-center justify-between gap-3">
                                          <div>
                                             <p className="text-sm font-semibold text-foreground">
                                                Available Badges
                                             </p>
                                             <p className="text-xs text-muted-foreground">
                                                {activeBadgeTargetId ? (
                                                   <>
                                                      Click a badge to fill{' '}
                                                      <span className="font-medium text-foreground">
                                                         {verifiedVisitors.find(
                                                            (visitor) =>
                                                               visitor.id ===
                                                               activeBadgeTargetId,
                                                         )?.name ?? 'visitor'}
                                                      </span>
                                                      &apos;s badge field, then
                                                      validate.
                                                   </>
                                                ) : (
                                                   'All verified visitors already have badges assigned.'
                                                )}
                                             </p>
                                          </div>
                                          <Badge variant="secondary">
                                             {availableBadges.length} free
                                          </Badge>
                                       </div>
                                       <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                          {availableBadges.length === 0 ? (
                                             <p className="col-span-full text-sm text-muted-foreground">
                                                No badges left in the available
                                                pool.
                                             </p>
                                          ) : (
                                             availableBadges.map((badge) => {
                                                const isSelected =
                                                   selectedPoolBadgeNumber ===
                                                   badge.number;
                                                return (
                                                   <button
                                                      key={badge.number}
                                                      type="button"
                                                      disabled={
                                                         !activeBadgeTargetId
                                                      }
                                                      onMouseDown={(event) => {
                                                         // Keep the active input focused.
                                                         event.preventDefault();
                                                      }}
                                                      onClick={() =>
                                                         selectAvailableBadge(
                                                            badge.number,
                                                         )
                                                      }
                                                      className={cn(
                                                         'flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-all',
                                                         isSelected
                                                            ? 'border-primary bg-primary/5 ring-2 ring-primary/25'
                                                            : 'bg-background hover:border-primary/40 hover:bg-muted/40',
                                                         !activeBadgeTargetId &&
                                                            'cursor-not-allowed opacity-60',
                                                      )}
                                                   >
                                                      <div>
                                                         <p className="font-mono text-sm font-semibold text-foreground">
                                                            {badge.number}
                                                         </p>
                                                         <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                            <QrCode className="size-3" />
                                                            {badge.qrCode}
                                                         </p>
                                                      </div>
                                                      <Badge
                                                         className={cn(
                                                            'border-0',
                                                            isSelected
                                                               ? 'bg-primary text-primary-foreground'
                                                               : 'bg-emerald-400/15 text-emerald-700 dark:text-emerald-300',
                                                         )}
                                                      >
                                                         {isSelected
                                                            ? 'Selected'
                                                            : 'Available'}
                                                      </Badge>
                                                   </button>
                                                );
                                             })
                                          )}
                                       </div>
                                    </div>
                                 </>
                              )}

                              {activeStepIdx === 2 && (
                                 <>
                                    <div className="space-y-2">
                                       <div className="flex items-center gap-2">
                                          <BadgeCheck className="size-4 text-primary" />
                                          <h3 className="text-lg font-semibold text-foreground">
                                             Review & Check In
                                          </h3>
                                       </div>
                                       <p className="text-sm leading-relaxed text-muted-foreground">
                                          Everything is ready. Confirm to check
                                          in {guestLabel} for visit{' '}
                                          <span className="font-mono text-foreground">
                                             {visit.id}
                                          </span>
                                          .
                                       </p>
                                    </div>

                                    <div className="rounded-xl border bg-card p-4">
                                       <div className="flex flex-wrap items-center justify-between gap-2">
                                          <p className="text-sm font-semibold text-foreground">
                                             Visit information
                                          </p>
                                          <Badge className="border-0 bg-teal-400/15 text-teal-700 dark:text-teal-300">
                                             Ready for check-in
                                          </Badge>
                                       </div>
                                       <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                                          <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                                             <p className="text-xs text-muted-foreground">
                                                Visit ID
                                             </p>
                                             <p className="mt-0.5 font-mono font-medium">
                                                {visit.id}
                                             </p>
                                          </div>
                                          <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                                             <p className="text-xs text-muted-foreground">
                                                Meeting type
                                             </p>
                                             <p className="mt-0.5 font-medium">
                                                {getMeetingTypeLabel(
                                                   visit.meetingType,
                                                )}
                                             </p>
                                          </div>
                                          <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                                             <p className="text-xs text-muted-foreground">
                                                Scheduled
                                             </p>
                                             <p className="mt-0.5 font-medium">
                                                {dateLabel}
                                             </p>
                                             <p className="text-xs text-muted-foreground">
                                                {timeLabel}
                                             </p>
                                          </div>
                                          <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                                             <p className="text-xs text-muted-foreground">
                                                Host & department
                                             </p>
                                             <p className="mt-0.5 font-medium">
                                                {visit.host}
                                             </p>
                                             <p className="text-xs text-muted-foreground">
                                                {visit.department}
                                             </p>
                                          </div>
                                          {locationLabel && (
                                             <div className="rounded-lg bg-muted/40 px-3 py-2.5 sm:col-span-2">
                                                <p className="text-xs text-muted-foreground">
                                                   Location
                                                </p>
                                                <p className="mt-0.5 font-medium">
                                                   {locationLabel}
                                                </p>
                                             </div>
                                          )}
                                       </div>
                                    </div>

                                    <div className="space-y-3">
                                       <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                          <Users className="size-3.5" />
                                          Verified visitors ({readyVisitors.length})
                                       </div>
                                       {readyVisitors.map((visitor) => (
                                          <div
                                             key={visitor.id}
                                             className="rounded-xl border bg-card p-4"
                                          >
                                             <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="min-w-0 space-y-1">
                                                   <p className="text-sm font-semibold text-foreground">
                                                      {visitor.name}
                                                   </p>
                                                   <p className="text-xs text-muted-foreground">
                                                      {visitor.organization ||
                                                         'Individual visitor'}
                                                   </p>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                   <Badge className="h-6 gap-1 border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                                      <CheckCircle2 className="size-3.5" />
                                                      Verified
                                                   </Badge>
                                                   <Badge className="h-6 gap-1 border-0 bg-sky-500/15 font-mono text-sky-700 dark:text-sky-300">
                                                      <IdCard className="size-3.5" />
                                                      {assignedBadges[visitor.id]}
                                                   </Badge>
                                                </div>
                                             </div>
                                             <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                <InfoRow
                                                   icon={Phone}
                                                   label="Phone"
                                                   value={visitor.phone}
                                                />
                                                <InfoRow
                                                   icon={Mail}
                                                   label="Email"
                                                   value={visitor.email}
                                                />
                                                <InfoRow
                                                   icon={IdCard}
                                                   label="ID"
                                                   value={
                                                      visitor.idType ||
                                                      visitor.idNumber
                                                         ? [
                                                              visitor.idType
                                                                 ? formatIdType(
                                                                      visitor.idType,
                                                                   )
                                                                 : null,
                                                              visitor.idNumber,
                                                           ]
                                                              .filter(Boolean)
                                                              .join(' · ')
                                                         : null
                                                   }
                                                />
                                                <InfoRow
                                                   icon={QrCode}
                                                   label="Badge QR"
                                                   value={
                                                      findMockBadge(
                                                         assignedBadges[
                                                            visitor.id
                                                         ] ?? '',
                                                      )?.qrCode
                                                   }
                                                />
                                             </div>
                                          </div>
                                       ))}
                                    </div>

                                    <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                                       Confirming will check in{' '}
                                       <span className="font-medium text-foreground">
                                          {guestLabel}
                                       </span>{' '}
                                       and update visit attendance.
                                    </div>
                                 </>
                              )}
                           </motion.div>
                        </AnimatePresence>
                     </div>

                     <div className="flex items-center gap-3 border-t border-border px-6 py-4 sm:px-8">
                        <Button
                           type="button"
                           variant="outline"
                           className="h-10 cursor-pointer rounded-lg shadow-xs"
                           onClick={handleBack}
                           disabled={activeStepIdx === 0 || isSubmitting}
                        >
                           Back
                        </Button>
                        <Button
                           type="button"
                           variant="ghost"
                           className="h-10 cursor-pointer"
                           onClick={() => onOpenChange(false)}
                           disabled={isSubmitting}
                        >
                           Cancel
                        </Button>
                        {isLastStep ? (
                           <Button
                              type="button"
                              className="ml-auto h-10 cursor-pointer gap-2 rounded-lg hover:bg-primary/90"
                              onClick={handleConfirm}
                              disabled={
                                 isSubmitting ||
                                 !canEnterStep3 ||
                                 readyVisitors.length === 0
                              }
                           >
                              <LogIn className="size-4" />
                              {isSubmitting ? 'Checking in…' : 'Check In'}
                           </Button>
                        ) : (
                           <Button
                              type="button"
                              className="ml-auto h-10 cursor-pointer rounded-lg hover:bg-primary/80"
                              onClick={handleNext}
                              disabled={continueDisabled}
                           >
                              Continue
                           </Button>
                        )}
                     </div>
                  </CardContent>
               </Card>
            )}
         </DialogContent>
      </Dialog>

      <QrScannerDialog
         open={Boolean(badgeScannerVisitorId)}
         onOpenChange={(next) => {
            if (!next) setBadgeScannerVisitorId(null);
         }}
         title="Scan Badge QR"
         description="Scan the physical badge QR code to assign it to the selected visitor."
         onScan={handleScannedBadge}
      />
      </>
   );
}
