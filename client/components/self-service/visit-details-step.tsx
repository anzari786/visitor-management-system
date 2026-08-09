'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { format, startOfDay } from 'date-fns';
import {
   CalendarIcon,
   ChevronDown,
   LoaderCircleIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
   HOST_DEPARTMENT_ORDER,
   HOST_EMPLOYEES,
   VISIT_PURPOSE_OPTIONS,
   VISIT_REQUEST_DEPARTMENTS,
   type HostEmployee,
} from '@/constants/visit-request';
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

function matchesQuery(text: string, query: string) {
   return text.toLowerCase().includes(query.toLowerCase());
}

async function searchHosts(query: string): Promise<HostEmployee[]> {
   await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 400 + 150),
   );

   const q = query.trim();
   if (!q) return HOST_EMPLOYEES;

   return HOST_EMPLOYEES.filter(
      (host) =>
         matchesQuery(host.name, q) ||
         matchesQuery(host.title, q) ||
         matchesQuery(host.departmentName, q),
   );
}

function groupHostsByDepartment(hosts: HostEmployee[]) {
   return HOST_DEPARTMENT_ORDER.map((departmentName) => ({
      departmentName,
      items: hosts.filter((h) => h.departmentName === departmentName),
   })).filter((group) => group.items.length > 0);
}

function HostEmployeeField({ form }: { form: FormType }) {
   const [open, setOpen] = useState(false);
   const [inputValue, setInputValue] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [results, setResults] = useState<HostEmployee[]>(HOST_EMPLOYEES);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      setIsLoading(true);
      setError(null);
      let ignore = false;

      const timer = setTimeout(async () => {
         try {
            const data = await searchHosts(inputValue);
            if (!ignore) setResults(data);
         } catch {
            if (!ignore) {
               setError('Unable to search hosts. Please try again.');
               setResults([]);
            }
         } finally {
            if (!ignore) setIsLoading(false);
         }
      }, 300);

      return () => {
         clearTimeout(timer);
         ignore = true;
      };
   }, [inputValue]);

   const grouped = useMemo(() => groupHostsByDepartment(results), [results]);

   let status: ReactNode = null;
   if (isLoading) {
      status = (
         <div className="flex items-center gap-2">
            <LoaderCircleIcon className="size-4 animate-spin" />
            Searching employees...
         </div>
      );
   } else if (error) {
      status = error;
   } else if (inputValue && results.length === 0) {
      status = `No employees found for "${inputValue}"`;
   } else if (results.length > 0) {
      status = `${results.length} employee${results.length === 1 ? '' : 's'} found`;
   }

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
                     if (!value) return;
                     const host = HOST_EMPLOYEES.find((h) => h.id === value);
                     if (host) {
                        form.setValue('departmentId', host.departmentId, {
                           shouldValidate: true,
                           shouldDirty: true,
                        });
                     }
                  }}
                  onInputValueChange={setInputValue}
                  defaultInputValue={
                     HOST_EMPLOYEES.find((h) => h.id === field.value)?.name ??
                     ''
                  }
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
                        {!isLoading && results.length === 0 ? (
                           <AutocompleteEmpty>
                              No matching employees found.
                           </AutocompleteEmpty>
                        ) : (
                           grouped.map((group, groupIndex) => (
                              <AutocompleteGroup key={group.departmentName}>
                                 {groupIndex > 0 && <AutocompleteSeparator />}
                                 <AutocompleteGroupLabel>
                                    {group.departmentName}
                                 </AutocompleteGroupLabel>
                                 {group.items.map((host) => (
                                    <AutocompleteItem
                                       key={host.id}
                                       value={host.id}
                                       label={host.name}
                                    >
                                       <div className="min-w-0 flex-1">
                                          <p className="truncate text-sm font-medium">
                                             {host.name}
                                          </p>
                                          <p className="truncate text-xs text-muted-foreground">
                                             {host.title}
                                          </p>
                                       </div>
                                    </AutocompleteItem>
                                 ))}
                              </AutocompleteGroup>
                           ))
                        )}
                     </AutocompleteList>
                  </AutocompleteContent>
               </Autocomplete>
               <FieldDescription>
                  The employee who will review and approve your visit request
               </FieldDescription>
               <FieldError>
                  {form.formState.errors.hostId?.message}
               </FieldError>
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
                              const currentEnd = form.getValues('endDate');
                              if (!currentEnd || currentEnd < date) {
                                 form.setValue('endDate', date, {
                                    shouldValidate: true,
                                 });
                              }
                           }
                           setOpen(false);
                        }}
                        disabled={(date) => {
                           if (date < startOfDay(new Date())) return true;
                           if (
                              name === 'endDate' &&
                              startDate &&
                              date < startOfDay(startDate)
                           ) {
                              return true;
                           }
                           return false;
                        }}
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
   return (
      <div className="space-y-8">
         <FieldSet className="w-full">
            <FieldLegend>Visit Details</FieldLegend>
            <FieldDescription>
               Provide details about your visit, including who you are visiting
               and the purpose of your visit.
            </FieldDescription>
            <FieldGroup>
               <HostEmployeeField form={form} />

               <Controller
                  name="departmentId"
                  control={form.control}
                  render={({ field }) => (
                     <Field>
                        <FieldLabel htmlFor="departmentId">
                           Department{' '}
                           <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                           value={field.value}
                           onValueChange={field.onChange}
                        >
                           <SelectTrigger
                              id="departmentId"
                              className="w-full"
                              aria-invalid={
                                 !!form.formState.errors.departmentId
                              }
                           >
                              <SelectValue placeholder="Select department" />
                           </SelectTrigger>
                           <SelectContent>
                              {VISIT_REQUEST_DEPARTMENTS.map((dept) => (
                                 <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                        <FieldDescription>
                           Filled from the selected host. You can change it if
                           needed.
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
            </FieldGroup>
         </FieldSet>

         <FieldSet className="w-full">
            <FieldLegend>Schedule</FieldLegend>
            <FieldDescription>
               Choose a single day or a date range for multi-day visits, along
               with daily visit hours.
            </FieldDescription>
            <FieldGroup>
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
                              className="bg-background appearance-none"
                              aria-invalid={!!form.formState.errors.endTime}
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
            </FieldGroup>
         </FieldSet>
      </div>
   );
}
