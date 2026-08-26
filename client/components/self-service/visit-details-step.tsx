'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { format, startOfDay } from 'date-fns';
import { CalendarIcon, ChevronDown, LoaderCircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VISIT_PURPOSE_OPTIONS } from '@/constants/visit-request';
import { useEmployeeSearch } from '@/hooks/use-self-service';
import type {
   VisitRequestFormInput,
   VisitRequestFormValues,
} from '@/lib/validations/visit-request.schema';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
   Field,
   FieldDescription,
   FieldError,
   FieldGroup,
   FieldLabel,
   FieldLegend,
   FieldSet,
} from '@/components/ui/field';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
   Autocomplete,
   AutocompleteContent,
   AutocompleteEmpty,
   AutocompleteGroup,
   AutocompleteGroupLabel,
   AutocompleteInput,
   AutocompleteItem,
   AutocompleteList,
   AutocompleteSeparator,
   AutocompleteStatus,
} from '@/components/ui/autocomplete';

type FormType = UseFormReturn<
   VisitRequestFormInput,
   unknown,
   VisitRequestFormValues
>;

type Employee = NonNullable<
   ReturnType<typeof useEmployeeSearch>['data']
>[number];

function HostEmployeeField({ form }: { form: FormType }) {
   const [open, setOpen] = useState(false);
   const [inputValue, setInputValue] = useState('');
   const search = useEmployeeSearch(
      { q: inputValue.trim(), limit: 25 },
      inputValue.trim().length > 0,
   );
   const results = (search.data ?? []).filter((employee) => employee.isActive);
   const grouped = useMemo(() => {
      const groups = new Map<string, Employee[]>();
      results.forEach((employee) => {
         const group = groups.get(employee.departmentName) ?? [];
         group.push(employee);
         groups.set(employee.departmentName, group);
      });
      return [...groups.entries()];
   }, [results]);
   let status: ReactNode = null;
   if (search.isLoading)
      status = (
         <div className="flex items-center gap-2">
            <LoaderCircleIcon className="size-4 animate-spin" />
            Searching employees...
         </div>
      );
   else if (search.isError)
      status = 'Unable to search hosts. Please try again.';
   else if (inputValue && results.length === 0)
      status = `No employees found for "${inputValue}"`;
   else if (results.length > 0)
      status = `${results.length} employee${results.length === 1 ? '' : 's'} found`;

   return (
      <Controller
         name="hostId"
         control={form.control}
         render={({ field }) => (
            <Field>
               <FieldLabel htmlFor="hostId">
                  Host Employee <span className="text-destructive">*</span>
               </FieldLabel>
               <Autocomplete
                  open={open}
                  onOpenChange={setOpen}
                  value={field.value ?? null}
                  onValueChange={(value) => {
                     field.onChange(value ?? undefined);
                     const employee = results.find((item) => item.id === value);
                     if (employee) {
                        form.setValue(
                           'hostName',
                           `${employee.firstName} ${employee.lastName}`,
                        );
                        form.setValue(
                           'departmentId',
                           employee.departmentCode ?? employee.departmentName,
                           { shouldValidate: true, shouldDirty: true },
                        );
                        form.setValue(
                           'departmentName',
                           employee.departmentName,
                        );
                     }
                  }}
                  onInputValueChange={setInputValue}
                  defaultInputValue={form.getValues('hostName') ?? ''}
               >
                  <AutocompleteInput
                     id="hostId"
                     placeholder="Search by name or department"
                     autoComplete="off"
                     showTrigger
                     showClear
                     aria-invalid={!!form.formState.errors.hostId}
                     onFocus={() => setOpen(true)}
                  />
                  <AutocompleteContent>
                     {status && (
                        <AutocompleteStatus>{status}</AutocompleteStatus>
                     )}
                     <AutocompleteList>
                        {!search.isLoading && grouped.length === 0 ? (
                           <AutocompleteEmpty>
                              No matching employees found.
                           </AutocompleteEmpty>
                        ) : (
                           grouped.map(
                              ([departmentName, employees], groupIndex) => (
                                 <AutocompleteGroup key={departmentName}>
                                    {groupIndex > 0 && (
                                       <AutocompleteSeparator />
                                    )}
                                    <AutocompleteGroupLabel>
                                       {departmentName}
                                    </AutocompleteGroupLabel>
                                    {employees.map((employee) => (
                                       <AutocompleteItem
                                          key={employee.id}
                                          value={employee.id}
                                          label={`${employee.firstName} ${employee.lastName}`}
                                       >
                                          <div className="min-w-0 flex-1">
                                             <p className="truncate text-sm font-medium">
                                                {employee.firstName}{' '}
                                                {employee.lastName}
                                             </p>
                                             <p className="truncate text-xs text-muted-foreground">
                                                {employee.position ??
                                                   employee.departmentName}
                                             </p>
                                          </div>
                                       </AutocompleteItem>
                                    ))}
                                 </AutocompleteGroup>
                              ),
                           )
                        )}
                     </AutocompleteList>
                  </AutocompleteContent>
               </Autocomplete>
               <FieldDescription>
                  Select the employee you’ll be visiting.
               </FieldDescription>
               <FieldError>{form.formState.errors.hostId?.message}</FieldError>
            </Field>
         )}
      />
   );
}

function DateField({
   form,
   name,
   label,
   placeholder,
}: {
   form: FormType;
   name: 'startDate' | 'endDate';
   label: string;
   placeholder: string;
}) {
   const [open, setOpen] = useState(false);
   const startDate = form.watch('startDate');
   return (
      <Controller
         name={name}
         control={form.control}
         render={({ field }) => (
            <Field>
               <FieldLabel htmlFor={name}>
                  {label} <span className="text-destructive">*</span>
               </FieldLabel>
               <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                     <Button
                        type="button"
                        variant="outline"
                        id={name}
                        className={cn(
                           'h-9 w-full justify-start px-3 font-normal shadow-xs',
                           !field.value && 'text-muted-foreground',
                        )}
                        aria-invalid={!!form.formState.errors[name]}
                     >
                        <CalendarIcon className="size-4 opacity-70" />
                        {field.value ? (
                           format(field.value, 'PPP')
                        ) : (
                           <span>{placeholder}</span>
                        )}
                        <ChevronDown className="ml-auto size-4 opacity-50" />
                     </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                     <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                           field.onChange(date);
                           if (name === 'startDate' && date) {
                              const end = form.getValues('endDate');
                              if (!end || end < date)
                                 form.setValue('endDate', date, {
                                    shouldValidate: true,
                                 });
                           }
                           setOpen(false);
                        }}
                        disabled={(date) =>
                           date < startOfDay(new Date()) ||
                           (name === 'endDate' &&
                              !!startDate &&
                              date < startOfDay(startDate))
                        }
                     />
                  </PopoverContent>
               </Popover>
               <FieldError>{form.formState.errors[name]?.message}</FieldError>
            </Field>
         )}
      />
   );
}

export function VisitDetailsStep({ form }: { form: FormType }) {
   const startDate = form.watch('startDate');
   const [scheduleType, setScheduleType] = useState<'single_day' | 'multi_day'>(
      'single_day',
   );
   return (
      <div className="space-y-8">
         <FieldSet className="w-full">
            <FieldLegend>Visit Details</FieldLegend>
            <FieldDescription>
               Provide your host, visit purpose, and preferred schedule.
            </FieldDescription>
            <FieldGroup>
               <HostEmployeeField form={form} />
               <Controller
                  name="departmentName"
                  control={form.control}
                  render={({ field }) => (
                     <Field>
                        <FieldLabel htmlFor="departmentName">
                           Department{' '}
                           <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select value={field.value} disabled>
                           <SelectTrigger
                              id="departmentName"
                              className="w-full"
                              aria-invalid={
                                 !!form.formState.errors.departmentId
                              }
                           >
                              <SelectValue placeholder="Select department" />
                           </SelectTrigger>
                           <SelectContent>
                              {field.value && (
                                 <SelectItem value={field.value}>
                                    {field.value}
                                 </SelectItem>
                              )}
                           </SelectContent>
                        </Select>
                        <FieldDescription>
                           Automatically filled from the selected host.
                        </FieldDescription>
                        <FieldError>
                           {form.formState.errors.departmentId?.message}
                        </FieldError>
                     </Field>
                  )}
               />
               <Controller
                  name="purpose"
                  control={form.control}
                  render={({ field }) => (
                     <Field>
                        <FieldLabel htmlFor="purpose">
                           Visit Purpose{' '}
                           <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                           value={field.value}
                           onValueChange={field.onChange}
                        >
                           <SelectTrigger
                              id="purpose"
                              className="w-full"
                              aria-invalid={!!form.formState.errors.purpose}
                           >
                              <SelectValue placeholder="Select the purpose of your visit" />
                           </SelectTrigger>
                           <SelectContent>
                              {VISIT_PURPOSE_OPTIONS.map((option) => (
                                 <SelectItem
                                    key={option.value}
                                    value={option.value}
                                 >
                                    {option.label}
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
            </FieldGroup>
            <FieldGroup>
               <Field>
                  <FieldLabel>Schedule Type</FieldLabel>
                  <Tabs
                     value={scheduleType}
                     onValueChange={(value) => {
                        setScheduleType(value as 'single_day' | 'multi_day');
                        if (value === 'single_day' && startDate)
                           form.setValue('endDate', startDate, {
                              shouldValidate: true,
                           });
                     }}
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
                  <DateField
                     form={form}
                     name="startDate"
                     label="Visit Date"
                     placeholder="Select visit date"
                  />
               ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                     <DateField
                        form={form}
                        name="startDate"
                        label="Start Date"
                        placeholder="Select start date"
                     />
                     <DateField
                        form={form}
                        name="endDate"
                        label="End Date"
                        placeholder="Select end date"
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
                              className="bg-background appearance-none"
                              aria-invalid={!!form.formState.errors.startTime}
                              {...field}
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
                              className="bg-background appearance-none"
                              aria-invalid={!!form.formState.errors.endTime}
                              {...field}
                           />
                           <FieldError>
                              {form.formState.errors.endTime?.message}
                           </FieldError>
                        </Field>
                     )}
                  />
               </div>
            </FieldGroup>
         </FieldSet>
      </div>
   );
}
