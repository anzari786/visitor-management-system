'use client';

import { Pencil } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import {
   FieldDescription,
   FieldLegend,
   FieldSet,
} from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import type {
   VisitRequestFormInput,
   VisitRequestFormValues,
} from '@/lib/validations/visit-request.schema';
import {
   formatVisitDateRange,
   formatVisitTime,
   getDepartmentName,
   getHostName,
   getIdTypeLabel,
   getPurposeLabel,
} from '@/services/visit-request.service';

type FormType = UseFormReturn<
   VisitRequestFormInput,
   unknown,
   VisitRequestFormValues
>;

type ReviewItem = {
   label: string;
   value?: string | null;
};

function ReviewSection({
   title,
   items,
   onEdit,
}: {
   title: string;
   items: ReviewItem[];
   onEdit: () => void;
}) {
   const visibleItems = items.filter(
      (item) => item.value != null && String(item.value).trim() !== '',
   );

   if (visibleItems.length === 0) return null;

   return (
      <section className="rounded-lg border border-border bg-muted/20">
         <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <Button
               type="button"
               variant="ghost"
               size="sm"
               className="h-8 cursor-pointer gap-1.5 text-muted-foreground hover:text-foreground"
               onClick={onEdit}
            >
               <Pencil className="size-3.5" />
               Edit
            </Button>
         </div>
         <dl className="divide-y divide-border/50">
            {visibleItems.map((item) => (
               <div
                  key={item.label}
                  className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4"
               >
                  <dt className="text-sm text-muted-foreground">{item.label}</dt>
                  <dd className="break-words text-sm font-medium text-foreground">
                     {item.value}
                  </dd>
               </div>
            ))}
         </dl>
      </section>
   );
}

export function ReviewSubmitStep({
   form,
   onEditStep,
}: {
   form: FormType;
   onEditStep: (step: number) => void;
}) {
   const values = form.watch();
   const visitors = values.visitors ?? [];

   const visitItems: ReviewItem[] = [
      {
         label: 'Host Name',
         value: values.hostId ? getHostName(values.hostId) : undefined,
      },
      {
         label: 'Department',
         value: values.departmentId
            ? getDepartmentName(values.departmentId)
            : undefined,
      },
      {
         label: 'Visit Purpose',
         value: values.purpose ? getPurposeLabel(values.purpose) : undefined,
      },
      {
         label: 'Visit Dates',
         value:
            values.startDate && values.endDate
               ? formatVisitDateRange(values.startDate, values.endDate)
               : undefined,
      },
      {
         label: 'Start Time',
         value: values.startTime
            ? formatVisitTime(values.startTime)
            : undefined,
      },
      {
         label: 'End Time',
         value: values.endTime ? formatVisitTime(values.endTime) : undefined,
      },
   ];

   return (
      <FieldSet className="w-full">
         <FieldLegend>Review & Submit</FieldLegend>
         <FieldDescription>
            Confirm visitor details, visit information, and schedule before
            submitting. Your host will review this request and you will be
            notified of their decision by email.
         </FieldDescription>
         <div className="mt-2 space-y-4">
            {visitors.map((visitor, index) => (
               <ReviewSection
                  key={`visitor-${index}`}
                  title={
                     index === 0
                        ? 'Primary Visitor'
                        : `Visitor ${index + 1}`
                  }
                  items={[
                     { label: 'First Name', value: visitor.firstName },
                     { label: 'Last Name', value: visitor.lastName },
                     { label: 'Email Address', value: visitor.email },
                     { label: 'Phone Number', value: visitor.phone },
                     {
                        label: 'Identification Type',
                        value: visitor.idType
                           ? getIdTypeLabel(visitor.idType)
                           : undefined,
                     },
                     {
                        label: 'Identification Number',
                        value: visitor.idNumber,
                     },
                  ]}
                  onEdit={() => onEditStep(0)}
               />
            ))}

            <ReviewSection
               title="Visit Details & Schedule"
               items={visitItems}
               onEdit={() => onEditStep(1)}
            />
         </div>
      </FieldSet>
   );
}
