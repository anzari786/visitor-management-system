'use client';

import { Controller, type FieldValues, type Path, type PathValue, type UseFormReturn } from 'react-hook-form';
import { startOfDay } from 'date-fns';
import { DatePickerField } from '@/components/shared/date-picker-field';
import { Input } from '@/components/ui/input';
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from '@/components/ui/field';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ScheduleFormFields = {
   scheduleType: 'single_day' | 'multi_day';
   visitDate?: Date;
   startDate?: Date;
   endDate?: Date;
   startTime: string;
   endTime: string;
};

type VisitScheduleFieldsProps<T extends FieldValues & ScheduleFormFields> = {
   form: UseFormReturn<T>;
   idPrefix?: string;
};

function fieldErrorMessage(error: unknown): string | undefined {
   if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
   ) {
      return error.message;
   }
   return undefined;
}

export function VisitScheduleFields<T extends FieldValues & ScheduleFormFields>({
   form,
   idPrefix = 'schedule',
}: VisitScheduleFieldsProps<T>) {
   const scheduleType = form.watch('scheduleType' as Path<T>) as
      | 'single_day'
      | 'multi_day';
   const startDate = form.watch('startDate' as Path<T>) as Date | undefined;
   const errors = form.formState.errors;

   return (
      <FieldGroup className="gap-4">
         <Field>
            <FieldLabel>Schedule Type</FieldLabel>
            <Tabs
               value={scheduleType}
               onValueChange={(value) =>
                  form.setValue(
                     'scheduleType' as Path<T>,
                     value as PathValue<T, Path<T>>,
                  )
               }
            >
               <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="single_day" className="cursor-pointer">
                     Single Day
                  </TabsTrigger>
                  <TabsTrigger value="multi_day" className="cursor-pointer">
                     Multi-Day
                  </TabsTrigger>
               </TabsList>
            </Tabs>
         </Field>

         {scheduleType === 'single_day' ? (
            <Controller
               name={'visitDate' as Path<T>}
               control={form.control}
               render={({ field }) => (
                  <DatePickerField
                     id={`${idPrefix}-visitDate`}
                     label="Visit Date"
                     value={field.value as Date | undefined}
                     onChange={field.onChange}
                     placeholder="Select visit date"
                     error={fieldErrorMessage(errors.visitDate)}
                  />
               )}
            />
         ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
               <Controller
                  name={'startDate' as Path<T>}
                  control={form.control}
                  render={({ field }) => (
                     <DatePickerField
                        id={`${idPrefix}-startDate`}
                        label="Start Date"
                        value={field.value as Date | undefined}
                        onChange={(date) => {
                           field.onChange(date);
                           if (date) {
                              const end = form.getValues(
                                 'endDate' as Path<T>,
                              ) as Date | undefined;
                              if (!end || end < date) {
                                 form.setValue(
                                    'endDate' as Path<T>,
                                    date as PathValue<T, Path<T>>,
                                    { shouldValidate: true },
                                 );
                              }
                           }
                        }}
                        placeholder="Select start date"
                        error={fieldErrorMessage(errors.startDate)}
                     />
                  )}
               />
               <Controller
                  name={'endDate' as Path<T>}
                  control={form.control}
                  render={({ field }) => (
                     <DatePickerField
                        id={`${idPrefix}-endDate`}
                        label="End Date"
                        value={field.value as Date | undefined}
                        onChange={field.onChange}
                        placeholder="Select end date"
                        error={fieldErrorMessage(errors.endDate)}
                        disabledDate={(date) => {
                           if (date < startOfDay(new Date())) return true;
                           if (startDate && date < startOfDay(startDate)) {
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
               name={'startTime' as Path<T>}
               control={form.control}
               render={({ field }) => (
                  <Field>
                     <FieldLabel htmlFor={`${idPrefix}-startTime`}>
                        Start Time <span className="text-destructive">*</span>
                     </FieldLabel>
                     <Input
                        id={`${idPrefix}-startTime`}
                        type="time"
                        className="appearance-none bg-background"
                        aria-invalid={!!errors.startTime}
                        value={(field.value as string) ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                     />
                     <FieldError>
                        {fieldErrorMessage(errors.startTime)}
                     </FieldError>
                  </Field>
               )}
            />
            <Controller
               name={'endTime' as Path<T>}
               control={form.control}
               render={({ field }) => (
                  <Field>
                     <FieldLabel htmlFor={`${idPrefix}-endTime`}>
                        End Time <span className="text-destructive">*</span>
                     </FieldLabel>
                     <Input
                        id={`${idPrefix}-endTime`}
                        type="time"
                        className="appearance-none bg-background"
                        aria-invalid={!!errors.endTime}
                        value={(field.value as string) ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                     />
                     <FieldError>
                        {fieldErrorMessage(errors.endTime)}
                     </FieldError>
                  </Field>
               )}
            />
         </div>
      </FieldGroup>
   );
}
