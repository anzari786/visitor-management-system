'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, isSameDay } from 'date-fns';
import { Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
   FieldGroup,
   FieldLabel,
} from '@/components/ui/field';
import { VisitScheduleFields } from '@/components/shared/visit-schedule-fields';
import { VisitLocationFields } from '@/components/shared/visit-location-fields';
import {
   visitUpdateDetailsSchema,
   type VisitUpdateDetailsInput,
   type VisitUpdateDetailsValues,
} from '@/lib/validations/visit-update-details.schema';
import type { FloorOption } from '@/constants/visit-location';

export interface VisitUpdateDetailsValue {
   date?: Date;
   endDate?: Date;
   startTime: string;
   endTime: string;
   scheduleType: 'single_day' | 'multi_day';
   floor: FloorOption;
   room: string;
}

type VisitUpdateDetailsProps = {
   isMultiDay?: boolean;
   defaultDate?: Date;
   defaultEndDate?: Date;
   defaultStartTime: string;
   defaultEndTime: string;
   defaultFloor?: FloorOption | string;
   defaultRoom?: string;
   visitorName?: string;
   orgName?: string;
   meetingType?: string;
   onCancel: () => void;
   onConfirm: (value: VisitUpdateDetailsValue) => void | Promise<void>;
};

function formatTimeLabel(time: string) {
   if (!time) return '—';
   const [hours, minutes] = time.split(':').map(Number);
   if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
   const period = hours >= 12 ? 'PM' : 'AM';
   const hour12 = hours % 12 || 12;
   return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function formatDateLabel({
   isMultiDay,
   date,
   endDate,
}: {
   isMultiDay: boolean;
   date?: Date;
   endDate?: Date;
}) {
   if (!date) return '—';
   if (isMultiDay && endDate && !isSameDay(date, endDate)) {
      return `${format(date, 'PPP')} – ${format(endDate, 'PPP')}`;
   }
   return format(date, 'PPP');
}

function CurrentDetail({
   label,
   value,
}: {
   label: string;
   value: string;
}) {
   return (
      <div className="min-w-0 space-y-0.5">
         <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {label}
         </p>
         <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
   );
}

export function VisitUpdateDetails({
   isMultiDay = false,
   defaultDate,
   defaultEndDate,
   defaultStartTime,
   defaultEndTime,
   defaultFloor,
   defaultRoom = '',
   visitorName,
   orgName,
   meetingType,
   onCancel,
   onConfirm,
}: VisitUpdateDetailsProps) {
   const form = useForm<
      VisitUpdateDetailsInput,
      unknown,
      VisitUpdateDetailsValues
   >({
      resolver: zodResolver(visitUpdateDetailsSchema),
      defaultValues: {
         scheduleType: isMultiDay ? 'multi_day' : 'single_day',
         visitDate: isMultiDay ? undefined : defaultDate,
         startDate: isMultiDay ? defaultDate : undefined,
         endDate: isMultiDay ? (defaultEndDate ?? defaultDate) : undefined,
         startTime: defaultStartTime,
         endTime: defaultEndTime,
         floor: (defaultFloor as FloorOption | undefined) ?? undefined,
         room: defaultRoom,
      },
      mode: 'onSubmit',
      reValidateMode: 'onChange',
      shouldFocusError: true,
   });

   useEffect(() => {
      form.reset({
         scheduleType: isMultiDay ? 'multi_day' : 'single_day',
         visitDate: isMultiDay ? undefined : defaultDate,
         startDate: isMultiDay ? defaultDate : undefined,
         endDate: isMultiDay ? (defaultEndDate ?? defaultDate) : undefined,
         startTime: defaultStartTime,
         endTime: defaultEndTime,
         floor: (defaultFloor as FloorOption | undefined) ?? undefined,
         room: defaultRoom,
      });
   }, [
      defaultDate,
      defaultEndDate,
      defaultEndTime,
      defaultFloor,
      defaultRoom,
      defaultStartTime,
      form,
      isMultiDay,
   ]);

   const isSubmitting = form.formState.isSubmitting;
   const currentDateLabel = formatDateLabel({
      isMultiDay,
      date: defaultDate,
      endDate: defaultEndDate,
   });

   const handleSubmit = form.handleSubmit(
      async (values) => {
         const payload: VisitUpdateDetailsValue =
            values.scheduleType === 'single_day'
               ? {
                    scheduleType: 'single_day',
                    date: values.visitDate,
                    endDate: undefined,
                    startTime: values.startTime,
                    endTime: values.endTime,
                    floor: values.floor,
                    room: values.room,
                 }
               : {
                    scheduleType: 'multi_day',
                    date: values.startDate,
                    endDate: values.endDate,
                    startTime: values.startTime,
                    endTime: values.endTime,
                    floor: values.floor,
                    room: values.room,
                 };

         await onConfirm(payload);
      },
      () => {
         requestAnimationFrame(() => {
            document
               .querySelector<HTMLElement>(
                  '[data-slot="dialog-content"] [aria-invalid="true"]',
               )
               ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
         });
      },
   );

   return (
      <form
         onSubmit={handleSubmit}
         noValidate
         className="flex min-h-0 flex-1 flex-col"
      >
         <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {(visitorName || meetingType) && (
               <p className="text-sm font-semibold text-foreground">
                  {visitorName}
                  {orgName ? ` · ${orgName}` : ''}
                  {meetingType ? ` · ${meetingType}` : ''}
               </p>
            )}

            <section className="space-y-3 rounded-xl border border-border bg-muted/25 p-4">
               <h3 className="text-sm font-semibold text-foreground">
                  Current Schedule
               </h3>
               <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CurrentDetail label="Date" value={currentDateLabel} />
                  <CurrentDetail
                     label="Start Time"
                     value={formatTimeLabel(defaultStartTime)}
                  />
                  <CurrentDetail
                     label="End Time"
                     value={formatTimeLabel(defaultEndTime)}
                  />
                  <CurrentDetail
                     label="Floor"
                     value={defaultFloor?.trim() || 'Not assigned'}
                  />
                  <CurrentDetail
                     label="Room"
                     value={defaultRoom?.trim() || 'Not assigned'}
                  />
               </div>
            </section>

            <FieldGroup className="gap-4">
               <FieldLabel className="text-sm font-semibold text-foreground">
                  New Schedule
               </FieldLabel>
               <VisitScheduleFields form={form} idPrefix="reschedule" />
            </FieldGroup>

            <FieldGroup className="gap-4">
               <FieldLabel className="text-sm font-semibold text-foreground">
                  Visit Location
               </FieldLabel>
               <VisitLocationFields
                  key={`${defaultFloor ?? ''}-${defaultRoom}`}
                  form={form}
                  idPrefix="reschedule"
                  showDescription={false}
               />
            </FieldGroup>
         </div>

         <div className="flex shrink-0 flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
            <Button
               type="button"
               variant="outline"
               className="cursor-pointer"
               disabled={isSubmitting}
               onClick={onCancel}
            >
               Cancel
            </Button>
            <Button
               type="submit"
               className="cursor-pointer gap-2"
               disabled={isSubmitting}
            >
               {isSubmitting ? (
                  <>
                     <Loader2 className="size-4 animate-spin" />
                     Rescheduling...
                  </>
               ) : (
                  <>
                     <Clock className="size-4" />
                     Reschedule
                  </>
               )}
            </Button>
         </div>
      </form>
   );
}
