'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { startOfDay } from 'date-fns';
import { Loader2, Send } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { DatePickerField } from '@/components/shared/date-picker-field';
import { VisitLocationFields } from '@/components/shared/visit-location-fields';
import { InvitationVisitorsFields } from './invitation-visitors-fields';
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

type CreateInvitationDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
};

/** Temporary stub — swap for `useCreateHostInvitation` from `@/hooks/use-host`. */
async function submitHostInvitation(_values: HostInvitationFormValues) {
   await new Promise((resolve) => setTimeout(resolve, 1000));
}

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

function normalizeOrganization(value?: string) {
   const trimmed = value?.trim();
   return trimmed ? trimmed : undefined;
}

export function CreateInvitationDialog({
   open,
   onOpenChange,
}: CreateInvitationDialogProps) {
   const [isSubmitting, setIsSubmitting] = useState(false);

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
      }
      onOpenChange(nextOpen);
   };

   const handleKnowsVisitorChange = (value: string) => {
      const knows = value as 'yes' | 'no';
      form.setValue('knowsVisitorInfo', knows);

      if (knows === 'yes') {
         form.clearErrors(['visitorCount', 'visitorOrganization']);
         form.setValue('visitorCount', 1);
         form.setValue('visitorOrganization', '');
         const visitors = form.getValues('visitors');
         if (!visitors?.length) {
            form.setValue('visitors', [{ ...emptyInvitationVisitorValues }]);
         }
      } else {
         form.clearErrors(['visitors']);
         form.setValue('visitors', [{ ...emptyInvitationVisitorValues }]);
         form.setValue(
            'visitorCount',
            Math.max(1, form.getValues('visitorCount') ?? 1),
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
                    visitorOrganization: normalizeOrganization(
                       values.visitorOrganization,
                    ),
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

         await submitHostInvitation(payload);

         const count =
            payload.knowsVisitorInfo === 'yes'
               ? payload.visitors.length
               : (payload.visitorCount ?? 1);

         const locationSummary = `${payload.floor}, ${payload.room}`;

         toast.success(
            payload.knowsVisitorInfo === 'yes'
               ? count > 1
                  ? `Invitations sent to ${count} visitors`
                  : 'Invitation sent to the visitor'
               : count > 1
                 ? 'Group invitation created successfully'
                 : 'Invitation created successfully',
            {
               description: `Visit location: ${locationSummary}`,
            },
         );
         form.reset(hostInvitationDefaultValues);
         onOpenChange(false);
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

   return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
         <DialogContent
            aria-describedby={undefined}
            className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
         >
            <DialogHeader className="shrink-0 space-y-1.5 border-b px-6 py-5 text-left">
               <DialogTitle>Invite Visitors</DialogTitle>
            </DialogHeader>

            <form
               onSubmit={onSubmit}
               noValidate
               className="flex min-h-0 flex-1 flex-col"
            >
               <div className={scrollAreaClass}>
                  <FieldGroup className="gap-4">
                     <SectionHeading
                        title="Visitor Information"
                        description={
                           knowsVisitorInfo === 'yes'
                              ? 'Enter contact details for each invited visitor.'
                              : 'You can create an invitation without knowing who will visit yet.'
                        }
                     />

                     <Field>
                        <FieldLabel>
                           Do you know the visitor information?
                        </FieldLabel>
                        <Tabs
                           value={knowsVisitorInfo}
                           onValueChange={handleKnowsVisitorChange}
                        >
                           <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger
                                 value="yes"
                                 className="cursor-pointer px-2 text-xs sm:px-3 sm:text-sm"
                              >
                                 Yes, I know them
                              </TabsTrigger>
                              <TabsTrigger
                                 value="no"
                                 className="cursor-pointer px-2 text-xs sm:px-3 sm:text-sm"
                              >
                                 No, not yet
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
                        <InvitationVisitorsFields form={form} />
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
                                       value={field.value ?? 1}
                                       onChange={field.onChange}
                                       aria-invalid={
                                          !!form.formState.errors.visitorCount
                                       }
                                    />
                                 )}
                              />
                              <FieldDescription>
                                 {(visitorCount ?? 1) === 1
                                    ? 'Use 1 for a single unknown visitor (e.g. technician or courier).'
                                    : 'Use 2 or more for a group visit. Names and contact details are not required.'}
                              </FieldDescription>
                              <FieldError>
                                 {form.formState.errors.visitorCount?.message}
                              </FieldError>
                           </Field>

                           <Field>
                              <FieldLabel htmlFor="unknownOrganization">
                                 Organization
                              </FieldLabel>
                              <Input
                                 id="unknownOrganization"
                                 autoComplete="off"
                                 placeholder="Visiting company or organization (optional)"
                                 {...form.register('visitorOrganization')}
                              />
                           </Field>
                        </>
                     )}
                  </FieldGroup>

                  <FieldGroup className="gap-4">
                     <SectionHeading
                        title="Visit Details"
                        description="Purpose, schedule, and where the visitor should go upon arrival."
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
                                    <SelectValue placeholder="Select visit purpose" />
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
                        <FieldLabel>Schedule Type</FieldLabel>
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
                                 Single Day
                              </TabsTrigger>
                              <TabsTrigger
                                 value="multi_day"
                                 className="cursor-pointer"
                              >
                                 Multi-Day
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
                                 label="Visit Date"
                                 value={field.value}
                                 onChange={field.onChange}
                                 placeholder="Select visit date"
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
                                    label="Start Date"
                                    value={field.value}
                                    onChange={(date) => {
                                       field.onChange(date);
                                       if (date) {
                                          const end =
                                             form.getValues('endDate');
                                          if (!end || end < date) {
                                             form.setValue('endDate', date, {
                                                shouldValidate: true,
                                             });
                                          }
                                       }
                                    }}
                                    placeholder="Select start date"
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
                                    label="End Date"
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select end date"
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
                           title="Visit Location"
                           description="Tell visitors exactly where to go when they arrive."
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
                           Sending...
                        </>
                     ) : (
                        <>
                           <Send className="size-4" />
                           Send Invitation
                        </>
                     )}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
