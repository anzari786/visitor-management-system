'use client';

import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogClose,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { visitAttendanceService } from '@/services/visit-attendance.service';
import type { BadgePrintJob, PrintJobStatus } from '@/types/print-job.types';
import {
   AlertTriangle,
   CheckCircle2Icon,
   Loader2,
   Printer,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

const POLL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;
const TERMINAL: PrintJobStatus[] = ['PRINTED', 'FAILED', 'CANCELLED'];

export type CheckInPrintTarget = {
   attendanceId: string;
   visitorName?: string;
   /** Seed status before the first poll (useful for mock / optimistic UI). */
   initialStatus?: PrintJobStatus;
   /** When true, advance QUEUED → PRINTING → PRINTED locally (desk mock). */
   simulate?: boolean;
};

type CheckInSuccessDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   visitorLabel: string;
   visitId: string;
   printTargets?: CheckInPrintTarget[];
   onRetryPrint?: (attendanceId: string) => Promise<BadgePrintJob | void>;
};

type TargetState = {
   attendanceId: string;
   visitorName?: string;
   status: PrintJobStatus;
   errorMessage?: string;
   simulate?: boolean;
   tick: number;
};

function isPrinting(status: PrintJobStatus) {
   return status === 'QUEUED' || status === 'PRINTING';
}

function StatusRow({
   label,
   status,
   errorMessage,
   onRetry,
   retrying,
}: {
   label: string;
   status: PrintJobStatus;
   errorMessage?: string;
   onRetry?: () => void;
   retrying?: boolean;
}) {
   const { t } = useTranslation();

   if (status === 'PRINTED') {
      return (
         <div className="flex items-start gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-2.5 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0">
               <p className="font-medium">{t('print.badgePrinted')}</p>
               {label ? (
                  <p className="text-xs opacity-80">{label}</p>
               ) : null}
            </div>
         </div>
      );
   }

   if (status === 'FAILED' || status === 'CANCELLED') {
      return (
         <div className="flex flex-col gap-2 rounded-lg border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <div className="flex items-start gap-2">
               <AlertTriangle className="mt-0.5 size-4 shrink-0" />
               <div className="min-w-0 flex-1">
                  <p className="font-medium">{t('print.badgeFailed')}</p>
                  {label ? (
                     <p className="text-xs opacity-80">{label}</p>
                  ) : null}
                  {errorMessage ? (
                     <p className="mt-1 text-xs opacity-80">{errorMessage}</p>
                  ) : null}
               </div>
            </div>
            {onRetry ? (
               <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="self-start"
                  disabled={retrying}
                  onClick={onRetry}
               >
                  {retrying ? (
                     <>
                        <Loader2 className="size-3.5 animate-spin" />
                        {t('print.retrying')}
                     </>
                  ) : (
                     t('print.retry')
                  )}
               </Button>
            ) : null}
         </div>
      );
   }

   return (
      <div className="flex items-start gap-2 rounded-lg border border-sky-200/80 bg-sky-50/60 px-3 py-2.5 text-sm text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-200">
         <Printer className="mt-0.5 size-4 shrink-0" />
         <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-medium">
               {t('print.printing')}
               <Loader2 className="size-3.5 animate-spin" />
            </p>
            {label ? <p className="text-xs opacity-80">{label}</p> : null}
         </div>
      </div>
   );
}

export function CheckInSuccessDialog({
   open,
   onOpenChange,
   visitorLabel,
   visitId,
   printTargets = [],
   onRetryPrint,
}: CheckInSuccessDialogProps) {
   const { t } = useTranslation();
   const [targets, setTargets] = React.useState<TargetState[]>([]);
   const [retryingId, setRetryingId] = React.useState<string | null>(null);
   const startedAtRef = React.useRef<number>(0);
   const targetsRef = React.useRef<TargetState[]>([]);

   React.useEffect(() => {
      targetsRef.current = targets;
   }, [targets]);

   React.useEffect(() => {
      if (!open) {
         setTargets([]);
         setRetryingId(null);
         return;
      }

      startedAtRef.current = Date.now();
      const seeded = printTargets.map((target) => ({
         attendanceId: target.attendanceId,
         visitorName: target.visitorName,
         status: target.initialStatus ?? ('QUEUED' as const),
         simulate: target.simulate,
         tick: 0,
      }));
      targetsRef.current = seeded;
      setTargets(seeded);
   }, [open, printTargets]);

   React.useEffect(() => {
      if (!open || printTargets.length === 0) return;

      const id = window.setInterval(async () => {
         const current = targetsRef.current;
         if (current.every((item) => TERMINAL.includes(item.status))) return;

         const timedOut = Date.now() - startedAtRef.current > POLL_TIMEOUT_MS;

         const next = await Promise.all(
            current.map(async (target) => {
               if (TERMINAL.includes(target.status)) return target;

               if (timedOut && isPrinting(target.status)) {
                  return {
                     ...target,
                     status: 'FAILED' as const,
                     errorMessage: t('print.timedOut'),
                  };
               }

               if (target.simulate || target.attendanceId.startsWith('mock-')) {
                  const tick = target.tick + 1;
                  if (tick >= 3) {
                     return { ...target, tick, status: 'PRINTED' as const };
                  }
                  if (tick >= 1) {
                     return { ...target, tick, status: 'PRINTING' as const };
                  }
                  return { ...target, tick };
               }

               try {
                  const { data } = await visitAttendanceService.getPrintStatus(
                     target.attendanceId,
                  );
                  const job = data.data;
                  if (!job) return target;
                  return {
                     ...target,
                     status: job.status,
                     errorMessage: job.errorMessage,
                  };
               } catch {
                  return target;
               }
            }),
         );
         targetsRef.current = next;
         setTargets(next);
      }, POLL_MS);

      return () => window.clearInterval(id);
   }, [open, printTargets, t]);

   const handleRetry = async (attendanceId: string) => {
      setRetryingId(attendanceId);
      try {
         let job: BadgePrintJob | void;
         if (onRetryPrint) {
            job = await onRetryPrint(attendanceId);
         } else if (!attendanceId.startsWith('mock-')) {
            const { data } =
               await visitAttendanceService.retryPrint(attendanceId);
            job = data.data;
         } else {
            job = {
               id: `mock-retry-${attendanceId}`,
               attendanceId,
               status: 'QUEUED',
            };
         }

         setTargets((prev) =>
            prev.map((target) =>
               target.attendanceId === attendanceId
                  ? {
                       ...target,
                       status: job?.status ?? 'QUEUED',
                       errorMessage: job?.errorMessage,
                       tick: 0,
                    }
                  : target,
            ),
         );
         startedAtRef.current = Date.now();
         toast.success(t('print.queued'));
      } catch (error) {
         toast.error(
            error instanceof Error ? error.message : t('print.retryFailed'),
         );
      } finally {
         setRetryingId(null);
      }
   };

   const showPrintRows = targets.length > 0;

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            className="duration-300 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:max-w-sm"
            showCloseButton={false}
         >
            <div className="flex flex-col items-center gap-4 py-2 text-center">
               <div className="flex size-16 items-center justify-center rounded-full bg-sky-400/10 text-sky-500">
                  <CheckCircle2Icon size={32} strokeWidth={1.5} />
               </div>
               <DialogHeader className="items-center space-y-2">
                  <DialogTitle className="text-lg">
                     {t('checkInSuccess.title')}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed">
                     {t('checkInSuccess.description', {
                        name: visitorLabel,
                        id: visitId,
                     })}
                  </DialogDescription>
               </DialogHeader>

               <div className="w-full space-y-2 text-left">
                  <div className="flex items-start gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-2.5 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
                     <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
                     <p className="font-medium">
                        {t('checkInSuccess.visitorCheckedIn')}
                     </p>
                  </div>

                  {showPrintRows
                     ? targets.map((target) => (
                          <StatusRow
                             key={target.attendanceId}
                             label={
                                targets.length > 1
                                   ? (target.visitorName ??
                                     target.attendanceId)
                                   : ''
                             }
                             status={target.status}
                             errorMessage={target.errorMessage}
                             retrying={retryingId === target.attendanceId}
                             onRetry={
                                target.status === 'FAILED' ||
                                target.status === 'CANCELLED'
                                   ? () => handleRetry(target.attendanceId)
                                   : undefined
                             }
                          />
                       ))
                     : null}
               </div>

               <DialogClose asChild>
                  <Button
                     type="button"
                     className="w-full cursor-pointer hover:bg-primary/90"
                  >
                     {t('common.done')}
                  </Button>
               </DialogClose>
            </div>
         </DialogContent>
      </Dialog>
   );
}
