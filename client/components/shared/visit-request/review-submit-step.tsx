'use client';

import type { ReactNode } from 'react';
import { isSameDay } from 'date-fns';
import type { UseFormReturn } from 'react-hook-form';
import {
   Building2,
   CalendarDays,
   CheckCircle2,
   Clock,
   Mail,
   Pencil,
   Phone,
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
   getPurposeLabel,
} from '@/services/visit-request.service';
import { useTranslation } from '@/lib/i18n';

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
               'max-w-[60%] text-right text-sm font-medium wrap-break-word text-foreground',
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
   const { t } = useTranslation();
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
            {t('common.edit')}
         </Button>
      </div>
   );
}

function ValueBadge({ children }: { children: ReactNode }) {
   return (
      <Badge variant="secondary" className="rounded-md px-2 py-0.5 font-medium">
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
   const { t } = useTranslation();
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
               {t('selfService.review.title')}
            </h2>
            <p className="text-sm text-muted-foreground">
               {t('selfService.review.description')}
            </p>
         </div>

         <div className="rounded-xl bg-muted/40 p-3 sm:p-4">
            <div className="overflow-hidden rounded-xl border border-border bg-background">
               <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2">
                     <span className="size-1.5 rounded-full bg-foreground" />
                     <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        {t('selfService.review.finalReview')}
                     </p>
                  </div>
                  <Badge
                     variant="secondary"
                     className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  >
                     {t('selfService.review.ready')}
                  </Badge>
               </div>

               <section>
                  <SectionHeader
                     title={t('selfService.review.visitorInfo')}
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
                                    label={t('common.fullName')}
                                    value={fullName || undefined}
                                 />
                                 <ReviewRow
                                    icon={<Mail />}
                                    label={t('common.email')}
                                    value={visitor.email}
                                 />
                                 <ReviewRow
                                    icon={<Phone />}
                                    label={t('common.phone')}
                                    value={visitor.phone}
                                 />
                                 {organization ? (
                                    <ReviewRow
                                       icon={<Building2 />}
                                       label={t('visitDetails.organization')}
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
                     title={t('selfService.details.title')}
                     onEdit={() => onEditStep(1)}
                  />
                  <div className="divide-y divide-border/50">
                     <ReviewRow
                        icon={<User />}
                        label={t('visits.col.host')}
                        value={values.hostId ? values.hostName : undefined}
                     />
                     <ReviewRow
                        icon={<Building2 />}
                        label={t('common.department')}
                        value={
                           values.departmentId
                              ? values.departmentName
                              : undefined
                        }
                     />
                     <ReviewRow
                        icon={<CheckCircle2 />}
                        label={t('common.purpose')}
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
                     title={t('selfService.review.schedule')}
                     onEdit={() => onEditStep(1)}
                  />
                  <div className="divide-y divide-border/50">
                     {isMultiDay ? (
                        <>
                           <ReviewRow
                              icon={<CalendarDays />}
                              label={t('schedule.startDate')}
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
                              label={t('schedule.endDate')}
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
                           label={t('common.date')}
                           value={
                              values.startDate
                                 ? formatVisitDateRange(
                                      values.startDate,
                                      values.startDate,
                                   )
                                 : undefined
                           }
                        />
                     )}
                     <ReviewRow
                        icon={<Clock />}
                        label={t('common.time')}
                        value={
                           values.startTime && values.endTime
                              ? `${formatVisitTime(values.startTime)} – ${formatVisitTime(values.endTime)}`
                              : undefined
                        }
                     />
                  </div>
               </section>
            </div>
         </div>
      </div>
   );
}
