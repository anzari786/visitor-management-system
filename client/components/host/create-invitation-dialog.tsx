'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { startOfDay } from 'date-fns';
import { CheckCircle2Icon, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { VISIT_PURPOSE_OPTIONS } from '@/constants/visit-purpose';
import {
   emptyInvitationVisitorValues,
   hostInvitationDefaultValues,
   hostInvitationSchema,
   invitationVisitorSchema,
   type HostInvitationFormInput,
   type HostInvitationFormValues,
} from '@/lib/validations/host-invitation.schema';
import { mapHostInvitationToApi } from '@/lib/map-host-invitation';
import { authService } from '@/services/auth.service';
import {
   hostService,
   type HostInvitationCreated,
} from '@/services/host.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { DatePickerField } from '@/components/shared/date-picker-field';
import { VisitLocationFields } from '@/components/shared/visit-location-fields';
import { InvitationVisitorsFields } from '@/components/common/invitation-visitors-fields';
import {
   Dialog,
   DialogContent,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import {
   Field,
   FieldDescription,
   FieldError,
   FieldGroup,
   FieldLabel,
} from '@/components/ui/field';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/i18n';

type CreateInvitationDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
};

const scrollAreaClass =
   'flex-1 space-y-8 overflow-y-auto px-6 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

function SectionHeading({
   title,
   description,
}: {
   title: string;
   description: string;
}) {
   return (
      <div className="space-y-1">
         <h3 className="text-sm font-semibold text-foreground">{title}</h3>
         <p className="text-sm text-muted-foreground">{description}</p>
      </div>
   );
}

export function CreateInvitationDialog({
   open,
   onOpenChange,
}: CreateInvitationDialogProps) {
   const { t } = useTranslation();
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [createdInvitation, setCreatedInvitation] =
      useState<HostInvitationCreated | null>(null);

   const form = useForm<
      HostInvitationFormInput,
      unknown,
      HostInvitationFormValues
   >({
      resolver: zodResolver(hostInvitationSchema),
      defaultValues: hostInvitationDefaultValues,
      mode: 'onSubmit',
      reValidateMode: 'onChange',
      shouldFocusError: true,
   });

   const knowsVisitorInfo = form.watch('knowsVisitorInfo');
   const scheduleType = form.watch('scheduleType');
   const visitorCount = form.watch('visitorCount');
   const startDate = form.watch('startDate');

   const handleOpenChange = (nextOpen: boolean) => {
      if (!nextOpen) {
         form.reset(hostInvitationDefaultValues);
         setCreatedInvitation(null);
      }
      onOpenChange(nextOpen);
   };

   const handleKnowsVisitorChange = (value: string) => {
      const knows = value as 'yes' | 'no';
      form.setValue('knowsVisitorInfo', knows);

      if (knows === 'yes') {
         form.clearErrors(['visitorCount', 'visitorOrganization']);
         form.setValue('visitorCount', 1, { shouldDirty: true });
         form.setValue('visitorOrganization', '', { shouldDirty: true });
         const visitors = form.getValues('visitors');
         if (!visitors?.length) {
            form.setValue('visitors', [{ ...emptyInvitationVisitorValues }], {
               shouldDirty: true,
            });
         }
      } else {
         form.clearErrors(['visitors']);
         form.setValue('visitors', [{ ...emptyInvitationVisitorValues }], {
            shouldDirty: true,
         });
         form.setValue(
            'visitorCount',
            Math.max(1, Number(form.getValues('visitorCount') ?? 1)),
            { shouldDirty: true },
         );
      }
   };

   const onInvalid = () => {
      requestAnimationFrame(() => {
         document
            .querySelector<HTMLElement>(
               '[data-slot="dialog-content"] [aria-invalid="true"]',
            )
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
   };

   const onSubmit = form.handleSubmit(async (values) => {
      setIsSubmitting(true);
      try {
         const payload: HostInvitationFormValues =
            values.knowsVisitorInfo === 'no'
               ? {
                    ...values,
                    visitors: [],
                    visitorOrganization: values.visitorOrganization?.trim()
                       ? values.visitorOrganization.trim()
                       : undefined,
                    visitorCount: values.visitorCount ?? 1,
                 }
               : {
                    ...values,
                    visitors: values.visitors.map((visitor) =>
                       invitationVisitorSchema.parse(visitor),
                    ),
                    visitorOrganization: undefined,
                    visitorCount: values.visitors.length,
                 };

         const { data: meResponse } = await authService.getMe();
         const employeeId = meResponse.data.employee?.id;

         if (!employeeId) {
            throw new Error(
               'Your account is not linked to an employee profile. Contact an administrator.',
            );
         }

         const apiPayload = mapHostInvitationToApi(payload, Number(employeeId));
         await hostService.createHostInvitation(apiPayload);

         setCreatedInvitation({ id: 'created', visitCode: 'created' });
         toast.success(t('host.invite.toast.createdSimple'));
         form.reset(hostInvitationDefaultValues);
      } catch (error) {
         const message =
            error instanceof Error
               ? error.message
               : 'Unable to create invitation. Please try again.';
         toast.error(message);
      } finally {
         setIsSubmitting(false);
      }
   }, onInvalid);

   if (createdInvitation) {
      return (
         <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
               aria-describedby={undefined}
               className="sm:max-w-sm data-open:zoom-in-50! data-closed:zoom-out-50 duration-300 [[data-slot=dialog-overlay]:has(~_&)]:duration-300"
            >
               <div className="flex flex-col items-center gap-4 py-2 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-500 dark:text-emerald-400">
                     <CheckCircle2Icon size={32} strokeWidth={1.5} />
                  </div>
                  <DialogHeader className="items-center space-y-1.5">
                     <DialogTitle className="text-lg">
                        {t('host.invite.created')}
                     </DialogTitle>
                     <p className="text-sm text-muted-foreground">
                        {t('host.invite.createdBody')}
                     </p>
                  </DialogHeader>
                  <Button
                     type="button"
                     className="w-full cursor-pointer hover:bg-primary/80"
                     onClick={() => handleOpenChange(false)}
                  >
                     {t('common.done')}
                  </Button>
               </div>
            </DialogContent>
         </Dialog>
      );
   }

   return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
         <DialogContent
            aria-describedby={undefined}
            className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
         >
            <DialogHeader className="shrink-0 space-y-1.5 border-b px-6 py-5 text-left">
               <DialogTitle>{t('host.invite.title')}</DialogTitle>
            </DialogHeader>

            <form
               onSubmit={onSubmit}
               noValidate
               className="flex min-h-0 flex-1 flex-col"
            >
               <div className={scrollAreaClass}>
                  <FieldGroup className="gap-4">
                     <SectionHeading
                        title={t('selfService.review.visitorInfo')}
                        description={
                           knowsVisitorInfo === 'yes'
                              ? 'Enter contact details for each invited visitor.'
                              : 'You can create an invitation without knowing who will visit yet.'
                        }
                     />

                     <Field>
                        <FieldLabel>{t('host.invite.knowVisitors')}</FieldLabel>
                        <Tabs
                           value={knowsVisitorInfo}
                           onValueChange={handleKnowsVisitorChange}
                        >
                           <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger
                                 value="yes"
                                 className="cursor-pointer px-2 text-xs sm:px-3 sm:text-sm"
                              >
                                 {t('host.invite.yesKnow')}
                              </TabsTrigger>
                              <TabsTrigger
                                 value="no"
                                 className="cursor-pointer px-2 text-xs sm:px-3 sm:text-sm"
                              >
                                 {t('host.invite.notYet')}
                              </TabsTrigger>
                           </TabsList>
                        </Tabs>
                        <FieldDescription>
                           {knowsVisitorInfo === 'yes'
                              ? 'Add one or more visitors with name, email, and phone.'
                              : 'Only the number of visitors is required.'}
                        </FieldDescription>
                     </Field>

                     {knowsVisitorInfo === 'yes' ? (
                        <InvitationVisitorsFields
                           form={form}
                           heading={t('host.invite.knownVisitors')}
                           description={t('host.invite.knownVisitorsHint')}
                        />
                     ) : (
                        <>
                           <Field>
                              <FieldLabel htmlFor="visitorCount">
                                 Number of Visitors{' '}
                                 <span className="text-destructive">*</span>
                              </FieldLabel>
                              <Controller
                                 name="visitorCount"
                                 control={form.control}
                                 render={({ field }) => (
                                    <NumberInput
                                       id="visitorCount"
                                       min={1}
                                       max={50}
                                       value={Number(field.value ?? 1)}
                                       onChange={(nextValue) =>
                                          field.onChange(Number(nextValue))
                                       }
                                       aria-invalid={
                                          !!form.formState.errors.visitorCount
                                       }
                                    />
                                 )}
                              />
                              <FieldDescription>
                                 {(visitorCount ?? 1) === 1
                                    ? 'For a single unknown visitor.'
                                    : 'For a group of unknown visitors.'}
                              </FieldDescription>
                              <FieldError>
                                 {form.formState.errors.visitorCount?.message}
                              </FieldError>
                           </Field>

                           <Field>
                              <FieldLabel htmlFor="visitorOrganization">
                                 {t('visitDetails.organization')}
                              </FieldLabel>
                              <Input
                                 id="visitorOrganization"
                                 autoComplete="off"
                                 placeholder={t('host.invite.orgPlaceholder')}
                                 {...form.register('visitorOrganization')}
                              />
                           </Field>
                        </>
                     )}
                  </FieldGroup>

                  <FieldGroup className="gap-4">
                     <SectionHeading
                        title={t('selfService.details.title')}
                        description={t('host.invite.visitDetailsHint')}
                     />

                     <Controller
                        name="purpose"
                        control={form.control}
                        render={({ field }) => (
                           <Field>
                              <FieldLabel htmlFor="purpose">
                                 Purpose{' '}
                                 <span className="text-destructive">*</span>
                              </FieldLabel>
                              <Select
                                 value={field.value}
                                 onValueChange={field.onChange}
                              >
                                 <SelectTrigger
                                    id="purpose"
                                    className="w-full"
                                    aria-invalid={
                                       !!form.formState.errors.purpose
                                    }
                                 >
                                    <SelectValue
                                       placeholder={t(
                                          'host.invite.selectPurpose',
                                       )}
                                    />
                                 </SelectTrigger>
                                 <SelectContent>
                                    {VISIT_PURPOSE_OPTIONS.map((opt) => (
                                       <SelectItem
                                          key={opt.value}
                                          value={opt.value}
                                       >
                                          {opt.label}
                                       </SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                              <FieldError>
                                 {form.formState.errors.purpose?.message}
                              </FieldError>
                           </Field>
                        )}
                     />

                     <Field>
                        <FieldLabel>{t('schedule.type')}</FieldLabel>
                        <Tabs
                           value={scheduleType}
                           onValueChange={(value) =>
                              form.setValue(
                                 'scheduleType',
                                 value as 'single_day' | 'multi_day',
                              )
                           }
                        >
                           <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger
                                 value="single_day"
                                 className="cursor-pointer"
                              >
                                 {t('schedule.singleDay')}
                              </TabsTrigger>
                              <TabsTrigger
                                 value="multi_day"
                                 className="cursor-pointer"
                              >
                                 {t('schedule.multiDay')}
                              </TabsTrigger>
                           </TabsList>
                        </Tabs>
                     </Field>

                     {scheduleType === 'single_day' ? (
                        <Controller
                           name="visitDate"
                           control={form.control}
                           render={({ field }) => (
                              <DatePickerField
                                 id="visitDate"
                                 label={t('schedule.visitDate')}
                                 value={field.value}
                                 onChange={field.onChange}
                                 placeholder={t('schedule.selectVisitDate')}
                                 error={
                                    form.formState.errors.visitDate?.message
                                 }
                                 disabledDate={(date) =>
                                    date < startOfDay(new Date())
                                 }
                              />
                           )}
                        />
                     ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                           <Controller
                              name="startDate"
                              control={form.control}
                              render={({ field }) => (
                                 <DatePickerField
                                    id="startDate"
                                    label={t('schedule.startDate')}
                                    value={field.value}
                                    onChange={(date) => {
                                       field.onChange(date);
                                       if (date) {
                                          const end = form.getValues('endDate');
                                          if (!end || end < date) {
                                             form.setValue('endDate', date, {
                                                shouldValidate: true,
                                             });
                                          }
                                       }
                                    }}
                                    placeholder={t('schedule.selectStartDate')}
                                    error={
                                       form.formState.errors.startDate?.message
                                    }
                                    disabledDate={(date) =>
                                       date < startOfDay(new Date())
                                    }
                                 />
                              )}
                           />
                           <Controller
                              name="endDate"
                              control={form.control}
                              render={({ field }) => (
                                 <DatePickerField
                                    id="endDate"
                                    label={t('schedule.endDate')}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder={t('schedule.selectEndDate')}
                                    error={
                                       form.formState.errors.endDate?.message
                                    }
                                    disabledDate={(date) => {
                                       if (date < startOfDay(new Date()))
                                          return true;
                                       if (
                                          startDate &&
                                          date < startOfDay(startDate)
                                       ) {
                                          return true;
                                       }
                                       return false;
                                    }}
                                 />
                              )}
                           />
                        </div>
                     )}

                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Controller
                           name="startTime"
                           control={form.control}
                           render={({ field }) => (
                              <Field>
                                 <FieldLabel htmlFor="startTime">
                                    Start Time{' '}
                                    <span className="text-destructive">*</span>
                                 </FieldLabel>
                                 <Input
                                    id="startTime"
                                    type="time"
                                    className="appearance-none bg-background"
                                    aria-invalid={
                                       !!form.formState.errors.startTime
                                    }
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                 />
                                 <FieldError>
                                    {form.formState.errors.startTime?.message}
                                 </FieldError>
                              </Field>
                           )}
                        />
                        <Controller
                           name="endTime"
                           control={form.control}
                           render={({ field }) => (
                              <Field>
                                 <FieldLabel htmlFor="endTime">
                                    End Time{' '}
                                    <span className="text-destructive">*</span>
                                 </FieldLabel>
                                 <Input
                                    id="endTime"
                                    type="time"
                                    className="appearance-none bg-background"
                                    aria-invalid={
                                       !!form.formState.errors.endTime
                                    }
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                 />
                                 <FieldError>
                                    {form.formState.errors.endTime?.message}
                                 </FieldError>
                              </Field>
                           )}
                        />
                     </div>

                     <div className="space-y-4">
                        <SectionHeading
                           title={t('host.invite.visitLocation')}
                           description={t('host.invite.visitLocationHint')}
                        />
                        <VisitLocationFields
                           form={form}
                           idPrefix="invitation"
                           showDescription={false}
                        />
                     </div>
                  </FieldGroup>
               </div>

               <DialogFooter className="shrink-0 gap-2 border-t px-6 py-4 sm:justify-end">
                  <Button
                     type="button"
                     variant="outline"
                     className="cursor-pointer"
                     disabled={isSubmitting}
                     onClick={() => handleOpenChange(false)}
                  >
                     {t('common.cancel')}
                  </Button>
                  <Button
                     type="submit"
                     className="cursor-pointer gap-2"
                     disabled={isSubmitting}
                  >
                     {isSubmitting ? (
                        <>
                           <Loader2 className="size-4 animate-spin" />
                           {t('host.invite.sending')}
                        </>
                     ) : (
                        <>
                           <Send className="size-4" />
                           {t('host.invite.send')}
                        </>
                     )}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
