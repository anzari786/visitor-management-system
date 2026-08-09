'use client';

import type { ReactNode } from 'react';
import { isSameDay } from 'date-fns';
import type { UseFormReturn } from 'react-hook-form';
import {
   Building2,
   CalendarDays,
   CheckCircle2,
   Clock,
   CreditCard,
   IdCard,
   Mail,
   Pencil,
   Phone,
   Send,
   User,
   Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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

type ReviewRowProps = {
   icon: ReactNode;
   label: string;
   value?: ReactNode;
   valueClassName?: string;
};

function ReviewRow({ icon, label, value, valueClassName }: ReviewRowProps) {
   if (value == null || value === '') return null;

   return (
      <div className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5">
         <div className="flex min-w-0 items-center gap-2.5 text-muted-foreground">
            <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-3.5">
               {icon}
            </span>
            <span className="text-sm">{label}</span>
         </div>
         <div
            className={cn(
               'max-w-[60%] text-right text-sm font-medium break-words text-foreground',
               valueClassName,
            )}
         >
            {value}
         </div>
      </div>
   );
}

function SectionHeader({
   title,
   onEdit,
}: {
   title: string;
   onEdit: () => void;
}) {
   return (
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5 sm:px-5">
         <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {title}
         </h3>
         <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 cursor-pointer gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={onEdit}
         >
            <Pencil className="size-3" />
            Edit
         </Button>
      </div>
   );
}

function ValueBadge({ children }: { children: ReactNode }) {
   return (
      <Badge
         variant="secondary"
         className="rounded-md px-2 py-0.5 font-medium"
      >
         {children}
      </Badge>
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
   const isMultiDay =
      !!values.startDate &&
      !!values.endDate &&
      !isSameDay(values.startDate, values.endDate);

   return (
      <div className="w-full space-y-5">
         <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
               Review your information
            </h2>
            <p className="text-sm text-muted-foreground">
               Make sure everything looks correct before submitting.
            </p>
         </div>

         <div className="rounded-xl bg-muted/40 p-3 sm:p-4">
            <div className="overflow-hidden rounded-xl border border-border bg-background">
               <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2">
                     <span className="size-1.5 rounded-full bg-foreground" />
                     <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Final Review
                     </p>
                  </div>
                  <Badge
                     variant="secondary"
                     className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  >
                     Ready to Submit
                  </Badge>
               </div>

               <section>
                  <SectionHeader
                     title="Visitor Information"
                     onEdit={() => onEditStep(0)}
                  />
                  <div className="divide-y divide-border/50">
                     {visitors.map((visitor, index) => {
                        const fullName = [visitor.firstName, visitor.lastName]
                           .filter(Boolean)
                           .join(' ');
                        const organization = visitor.organization?.trim();

                        return (
                           <div
                              key={`visitor-${index}`}
                              className={cn(
                                 visitors.length > 1 && index > 0 && 'pt-1',
                              )}
                           >
                              {visitors.length > 1 && (
                                 <div className="flex items-center gap-2 px-4 pt-3 pb-1 sm:px-5">
                                    <Users className="size-3.5 text-muted-foreground" />
                                    <p className="text-xs font-semibold text-foreground">
                                       {index === 0
                                          ? 'Primary Visitor'
                                          : `Visitor ${index + 1}`}
                                    </p>
                                 </div>
                              )}
                              <div className="divide-y divide-border/50">
                                 <ReviewRow
                                    icon={<User />}
                                    label="Full Name"
                                    value={fullName || undefined}
                                 />
                                 <ReviewRow
                                    icon={<Mail />}
                                    label="Email"
                                    value={visitor.email}
                                 />
                                 <ReviewRow
                                    icon={<Phone />}
                                    label="Phone"
                                    value={visitor.phone}
                                 />
                                 <ReviewRow
                                    icon={<IdCard />}
                                    label="ID Type"
                                    value={
                                       visitor.idType ? (
                                          <ValueBadge>
                                             {getIdTypeLabel(visitor.idType)}
                                          </ValueBadge>
                                       ) : undefined
                                    }
                                 />
                                 <ReviewRow
                                    icon={<CreditCard />}
                                    label="ID Number"
                                    value={visitor.idNumber}
                                    valueClassName="font-mono text-[13px]"
                                 />
                                 {organization ? (
                                    <ReviewRow
                                       icon={<Building2 />}
                                       label="Organization"
                                       value={organization}
                                    />
                                 ) : null}
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </section>

               <section className="border-t border-border/60">
                  <SectionHeader
                     title="Visit Details"
                     onEdit={() => onEditStep(1)}
                  />
                  <div className="divide-y divide-border/50">
                     <ReviewRow
                        icon={<User />}
                        label="Host"
                        value={
                           values.hostId
                              ? getHostName(values.hostId)
                              : undefined
                        }
                     />
                     <ReviewRow
                        icon={<Building2 />}
                        label="Department"
                        value={
                           values.departmentId
                              ? getDepartmentName(values.departmentId)
                              : undefined
                        }
                     />
                     <ReviewRow
                        icon={<CheckCircle2 />}
                        label="Purpose"
                        value={
                           values.purpose ? (
                              <ValueBadge>
                                 {getPurposeLabel(values.purpose)}
                              </ValueBadge>
                           ) : undefined
                        }
                     />
                  </div>
               </section>

               <section className="border-t border-border/60">
                  <SectionHeader
                     title="Schedule"
                     onEdit={() => onEditStep(1)}
                  />
                  <div className="divide-y divide-border/50">
                     {isMultiDay ? (
                        <>
                           <ReviewRow
                              icon={<CalendarDays />}
                              label="Start Date"
                              value={
                                 values.startDate
                                    ? formatVisitDateRange(
                                         values.startDate,
                                         values.startDate,
                                      )
                                    : undefined
                              }
                           />
                           <ReviewRow
                              icon={<CalendarDays />}
                              label="End Date"
                              value={
                                 values.endDate
                                    ? formatVisitDateRange(
                                         values.endDate,
                                         values.endDate,
                                      )
                                    : undefined
                              }
                           />
                        </>
                     ) : (
                        <ReviewRow
                           icon={<CalendarDays />}
                           label="Visit Date"
                           value={
                              values.startDate && values.endDate
                                 ? formatVisitDateRange(
                                      values.startDate,
                                      values.endDate,
                                   )
                                 : undefined
                           }
                        />
                     )}
                     <ReviewRow
                        icon={<Clock />}
                        label="Start Time"
                        value={
                           values.startTime
                              ? formatVisitTime(values.startTime)
                              : undefined
                        }
                     />
                     <ReviewRow
                        icon={<Clock />}
                        label="End Time"
                        value={
                           values.endTime
                              ? formatVisitTime(values.endTime)
                              : undefined
                        }
                     />
                     {isMultiDay ? (
                        <ReviewRow
                           icon={<CalendarDays />}
                           label="Duration"
                           value={<ValueBadge>Multi-day visit</ValueBadge>}
                        />
                     ) : null}
                  </div>
               </section>
            </div>
         </div>

         <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3.5 sm:px-5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
               <Send className="size-4" />
            </div>
            <div className="min-w-0 space-y-0.5 pt-0.5">
               <p className="text-sm font-semibold text-foreground">
                  Almost there!
               </p>
               <p className="text-sm text-muted-foreground">
                  Your host will review this request and you&apos;ll be notified
                  of their decision by email. Double-check the details above,
                  then submit when you&apos;re ready.
               </p>
            </div>
         </div>
      </div>
   );
}
