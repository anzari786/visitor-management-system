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
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { ID_TYPE_OPTIONS } from '@/constants/visit';
import { getMeetingTypeLabel } from '@/constants/meeting-types';
import { cn } from '@/lib/utils';
import type { IdType, ManagedVisit, ManagedVisitor } from '@/types/visit.types';
import { format, parseISO } from 'date-fns';
import {
   BadgeCheck,
   Building2,
   CheckCircle2,
   ChevronRight,
   CircleXIcon,
   IdCard,
   LogIn,
   Mail,
   Phone,
   Printer,
   ShieldAlert,
   Undo2,
   Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { toast } from 'sonner';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const CHECK_IN_STEPS = [
   {
      id: 1,
      value: 'verify',
      title: 'Verify Identity',
      description: 'Confirm each guest',
   },
   {
      id: 2,
      value: 'review',
      title: 'Review & Check In',
      description: 'Confirm check-in',
   },
] as const;

export type CheckInConfirmPayload = {
   visitorIds: string[];
};

type CheckInDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   visit: ManagedVisit | null;
   visitors?: ManagedVisitor[];
   onConfirm: (payload: CheckInConfirmPayload) => void | Promise<void>;
};

const verificationSchema = z.object({
   verifications: z.array(
      z.object({
         visitorId: z.string(),
         idType: z.custom<IdType>(
            (val) => typeof val === 'string' && val.length > 0,
            {
               message: 'Select an ID type',
            },
         ),
         idNumber: z.string().trim().min(1, 'Enter the ID number'),
      }),
   ),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

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
   onConfirm,
}: CheckInDialogProps) {
   const [activeStepIdx, setActiveStepIdx] = React.useState(0);
   const [isSubmitting, setIsSubmitting] = React.useState(false);
   const [verifiedIds, setVerifiedIds] = React.useState<
      Record<string, boolean>
   >({});
   const [activeVerifyVisitorId, setActiveVerifyVisitorId] = React.useState<
      string | null
   >(null);
   const verifyForm = useForm<VerificationFormValues>({
      resolver: zodResolver(verificationSchema),
      defaultValues: { verifications: [] },
   });

   const { fields: verificationFields, replace: replaceVerifications } =
      useFieldArray({
         control: verifyForm.control,
         name: 'verifications',
      });

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
         replaceVerifications([]);
         setActiveVerifyVisitorId(null);
         return;
      }

      setVerifiedIds({});
      replaceVerifications(
         visitors.map((visitor) => ({
            visitorId: visitor.id,
            idType: 'national_id' as IdType,
            idNumber: '', // always starts empty — user types this, never prefilled
         })),
      );
      setActiveStepIdx(0);
   }, [open, visitors]);

   const verifiedVisitors = visitors.filter((v) => verifiedIds[v.id]);
   const hasVerified = verifiedVisitors.length > 0;
   const canEnterStep2 = hasVerified;
   const isLastStep = activeStepIdx === CHECK_IN_STEPS.length - 1;

   const activeVerificationTargetId = React.useMemo(() => {
      if (activeVerifyVisitorId && !verifiedIds[activeVerifyVisitorId]) {
         return activeVerifyVisitorId;
      }
      return visitors.find((visitor) => !verifiedIds[visitor.id])?.id ?? null;
   }, [activeVerifyVisitorId, verifiedIds, visitors]);

   React.useEffect(() => {
      if (activeStepIdx !== 0) return;
      if (
         activeVerificationTargetId &&
         activeVerificationTargetId !== activeVerifyVisitorId
      ) {
         setActiveVerifyVisitorId(activeVerificationTargetId);
      }
   }, [activeStepIdx, activeVerificationTargetId, activeVerifyVisitorId]);

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
      verifiedVisitors.length === 1
         ? (verifiedVisitors[0]?.name ?? 'Visitor')
         : `${verifiedVisitors.length} visitors`;

   const goToStep = (index: number) => {
      if (index === activeStepIdx) return;
      if (index > activeStepIdx && index >= 1 && !canEnterStep2) {
         toast.error('Verify at least one visitor before continuing');
         return;
      }
      setActiveStepIdx(index);
   };

   const handleNext = () => {
      if (activeStepIdx === 0 && !canEnterStep2) {
         toast.error('Verify at least one visitor before review');
         return;
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

   const verifyVisitor = async (visitorId: string) => {
      const index = verificationFields.findIndex(
         (v) => v.visitorId === visitorId,
      );
      if (index === -1) return;

      const valid = await verifyForm.trigger(`verifications.${index}`);
      if (!valid) return;

      setVerifiedIds((prev) => ({ ...prev, [visitorId]: true }));
      toast.success('Identity verified');
   };

   const unverifyVisitor = (visitorId: string) => {
      setVerifiedIds((prev) => {
         const next = { ...prev };
         delete next[visitorId];
         return next;
      });
      if (activeStepIdx > 0) {
         setActiveStepIdx(0);
      }
   };

   const handleConfirm = async () => {
      if (isSubmitting || !hasVerified) return;
      setIsSubmitting(true);
      try {
         await onConfirm({
            visitorIds: verifiedVisitors.map((visitor) => visitor.id),
         });
         onOpenChange(false);
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            className="gap-0 overflow-hidden p-0 duration-300 sm:max-w-5xl"
            showCloseButton={false}
         >
            <DialogHeader className="space-y-1.5 border-b px-6 py-5 text-left sm:px-8">
               <DialogTitle className="text-xl font-semibold tracking-tight">
                  Check In Visitor
               </DialogTitle>
               <DialogDescription className="text-sm leading-relaxed">
                  Verify identity, then confirm check-in. A visitor badge will
                  print automatically after check-in
                  {visit ? (
                     <>
                        {' '}
                        for{' '}
                        <span className="font-mono text-foreground">
                           {visit.id}
                        </span>
                     </>
                  ) : null}
                  .
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
                           const locked = index >= 1 && !canEnterStep2;

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
                                          <BadgeCheck className="size-4 text-primary" />
                                          <h3 className="text-lg font-semibold text-foreground">
                                             Verify Identity
                                          </h3>
                                       </div>
                                       <p className="text-sm leading-relaxed text-muted-foreground">
                                          Confirm each visitor&apos;s identity
                                          against their ID details before
                                          check-in.
                                       </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3.5 py-2.5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                                       <ShieldAlert className="size-4 shrink-0" />
                                       <span>
                                          Verify at least one visitor to
                                          continue. A thermal badge prints after
                                          check-in.
                                       </span>
                                    </div>

                                    <div className="space-y-3">
                                       {visitors.map((visitor, index) => {
                                          const verified = Boolean(
                                             verifiedIds[visitor.id],
                                          );
                                          const fieldErrors =
                                             verifyForm.formState.errors
                                                .verifications?.[index];
                                          const currentValues =
                                             verifyForm.watch(
                                                `verifications.${index}`,
                                             );

                                          return (
                                             <div
                                                key={visitor.id}
                                                className={cn(
                                                   'rounded-xl border p-4 transition-colors',
                                                   verified
                                                      ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                                                      : activeVerificationTargetId ===
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
                                                            'Individual visitor'}
                                                      </p>
                                                   </div>
                                                   {verified ? (
                                                      <Badge className="h-6 gap-1 border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                                         <CheckCircle2 className="size-3.5" />
                                                         Verified
                                                      </Badge>
                                                   ) : (
                                                      <Button
                                                         type="button"
                                                         variant="outline"
                                                         size="sm"
                                                         className="rounded-lg cursor-pointer"
                                                         onClick={() =>
                                                            verifyVisitor(
                                                               visitor.id,
                                                            )
                                                         }
                                                      >
                                                         <BadgeCheck className="size-4" />
                                                         Verify Identity
                                                      </Button>
                                                   )}
                                                </div>

                                                {verified ? (
                                                   <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background/80 px-3 py-2.5">
                                                      <p className="font-mono text-sm font-semibold text-foreground">
                                                         {formatIdType(
                                                            currentValues.idType,
                                                         )}{' '}
                                                         ·{' '}
                                                         {
                                                            currentValues.idNumber
                                                         }
                                                      </p>
                                                      <Button
                                                         variant="outline"
                                                         size="sm"
                                                         className="rounded-lg cursor-pointer"
                                                         onClick={() =>
                                                            unverifyVisitor(
                                                               visitor.id,
                                                            )
                                                         }
                                                      >
                                                         <Undo2 size={16} />
                                                         Undo
                                                      </Button>
                                                   </div>
                                                ) : (
                                                   <div className="mt-3 space-y-2">
                                                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                         <Field>
                                                            <FieldLabel
                                                               htmlFor={`verifications.${index}.idType`}
                                                            >
                                                               ID Type{' '}
                                                               <span className="text-destructive">
                                                                  *
                                                               </span>
                                                            </FieldLabel>
                                                            <Controller
                                                               name={`verifications.${index}.idType`}
                                                               control={
                                                                  verifyForm.control
                                                               }
                                                               render={({
                                                                  field: controllerField,
                                                               }) => (
                                                                  <Select
                                                                     value={
                                                                        controllerField.value
                                                                     }
                                                                     onValueChange={
                                                                        controllerField.onChange
                                                                     }
                                                                  >
                                                                     <SelectTrigger
                                                                        id={`verifications.${index}.idType`}
                                                                        className="w-full"
                                                                        aria-invalid={
                                                                           !!fieldErrors?.idType
                                                                        }
                                                                     >
                                                                        <SelectValue placeholder="Select ID type" />
                                                                     </SelectTrigger>
                                                                     <SelectContent>
                                                                        {ID_TYPE_OPTIONS.map(
                                                                           (
                                                                              opt,
                                                                           ) => (
                                                                              <SelectItem
                                                                                 key={
                                                                                    opt.value
                                                                                 }
                                                                                 value={
                                                                                    opt.value
                                                                                 }
                                                                              >
                                                                                 {
                                                                                    opt.label
                                                                                 }
                                                                              </SelectItem>
                                                                           ),
                                                                        )}
                                                                     </SelectContent>
                                                                  </Select>
                                                               )}
                                                            />
                                                            <FieldError>
                                                               {
                                                                  fieldErrors
                                                                     ?.idType
                                                                     ?.message
                                                               }
                                                            </FieldError>
                                                         </Field>

                                                         <Field>
                                                            <FieldLabel
                                                               htmlFor={`verifications.${index}.idNumber`}
                                                            >
                                                               ID Number{' '}
                                                               <span className="text-destructive">
                                                                  *
                                                               </span>
                                                            </FieldLabel>
                                                            <Controller
                                                               name={`verifications.${index}.idNumber`}
                                                               control={
                                                                  verifyForm.control
                                                               }
                                                               render={({
                                                                  field: controllerField,
                                                               }) => (
                                                                  <div className="relative">
                                                                     <Input
                                                                        {...controllerField}
                                                                        id={`verifications.${index}.idNumber`}
                                                                        placeholder="Enter identification number"
                                                                        aria-invalid={
                                                                           !!fieldErrors?.idNumber
                                                                        }
                                                                        className="pr-9"
                                                                        onFocus={() =>
                                                                           setActiveVerifyVisitorId(
                                                                              visitor.id,
                                                                           )
                                                                        }
                                                                        onKeyDown={(
                                                                           event,
                                                                        ) => {
                                                                           if (
                                                                              event.key ===
                                                                              'Enter'
                                                                           ) {
                                                                              event.preventDefault();
                                                                              verifyVisitor(
                                                                                 visitor.id,
                                                                              );
                                                                           }
                                                                        }}
                                                                     />
                                                                     {controllerField.value && (
                                                                        <Button
                                                                           type="button"
                                                                           variant="ghost"
                                                                           size="icon"
                                                                           onClick={() =>
                                                                              controllerField.onChange(
                                                                                 '',
                                                                              )
                                                                           }
                                                                           className="text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent cursor-pointer"
                                                                        >
                                                                           <CircleXIcon className="text-red-500" />
                                                                           <span className="sr-only">
                                                                              Clear
                                                                              input
                                                                           </span>
                                                                        </Button>
                                                                     )}
                                                                  </div>
                                                               )}
                                                            />
                                                            <FieldError>
                                                               {
                                                                  fieldErrors
                                                                     ?.idNumber
                                                                     ?.message
                                                               }
                                                            </FieldError>
                                                         </Field>
                                                      </div>
                                                   </div>
                                                )}
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
                                          <LogIn className="size-4 text-primary" />
                                          <h3 className="text-lg font-semibold text-foreground">
                                             Review & Check In
                                          </h3>
                                       </div>
                                       <p className="text-sm leading-relaxed text-muted-foreground">
                                          Confirm the visit details. Thermal
                                          badges print automatically for each
                                          checked-in visitor.
                                       </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-200/80 bg-sky-50/70 px-3.5 py-2.5 text-sm text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-200">
                                       <Printer className="size-4 shrink-0" />
                                       <span>
                                          After check-in, the desk printer will
                                          issue a one-time visitor badge for{' '}
                                          {guestLabel}.
                                       </span>
                                    </div>

                                    <div className="rounded-xl border bg-card p-4">
                                       <div className="mb-3 flex items-center justify-between gap-2">
                                          <p className="font-mono text-sm font-semibold text-foreground">
                                             {visit.id}
                                          </p>
                                          <Badge variant="secondary">
                                             {getMeetingTypeLabel(
                                                visit.meetingType,
                                             )}
                                          </Badge>
                                       </div>
                                       <div className="grid gap-3 sm:grid-cols-2">
                                          <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                                             <p className="text-xs text-muted-foreground">
                                                Schedule
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
                                          Verified visitors (
                                          {verifiedVisitors.length})
                                       </div>
                                       {verifiedVisitors.map((visitor) => (
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
                                                <Badge className="h-6 gap-1 border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                                   <CheckCircle2 className="size-3.5" />
                                                   Verified
                                                </Badge>
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
                                                         : undefined
                                                   }
                                                />
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </>
                              )}
                           </motion.div>
                        </AnimatePresence>
                     </div>

                     <div className="flex items-center justify-between gap-3 border-t px-6 py-4 sm:px-8">
                        <Button
                           type="button"
                           variant="ghost"
                           className="cursor-pointer"
                           onClick={() =>
                              activeStepIdx === 0
                                 ? onOpenChange(false)
                                 : handleBack()
                           }
                           disabled={isSubmitting}
                        >
                           {activeStepIdx === 0 ? 'Cancel' : 'Back'}
                        </Button>
                        <div className="flex items-center gap-2">
                           {!isLastStep ? (
                              <Button
                                 type="button"
                                 className="cursor-pointer gap-2 hover:bg-primary/90"
                                 onClick={handleNext}
                                 disabled={!canEnterStep2}
                              >
                                 Continue
                                 <ChevronRight className="size-4" />
                              </Button>
                           ) : (
                              <Button
                                 type="button"
                                 className="cursor-pointer gap-2 hover:bg-primary/90"
                                 onClick={handleConfirm}
                                 disabled={isSubmitting || !hasVerified}
                              >
                                 <LogIn className="size-4" />
                                 {isSubmitting
                                    ? 'Checking in…'
                                    : `Check In ${guestLabel}`}
                              </Button>
                           )}
                        </div>
                     </div>
                  </CardContent>
               </Card>
            )}
         </DialogContent>
      </Dialog>
   );
}
