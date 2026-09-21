'use client';

import { Controller, useFieldArray, type UseFormReturn } from 'react-hook-form';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatEthiopianPhone } from '@/lib/phone';
import {
   DEFAULT_NATIONALITY,
   NATIONALITY_OPTIONS,
} from '@/constants/nationalities';
import {
   emptyInvitationVisitorValues,
   type HostInvitationFormInput,
   type HostInvitationFormValues,
} from '@/lib/validations/host-invitation.schema';
import { Button } from '@/components/ui/button';
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
import { useTranslation } from '@/lib/i18n';
import {
   Autocomplete,
   AutocompleteContent,
   AutocompleteEmpty,
   AutocompleteInput,
   AutocompleteItem,
   AutocompleteList,
} from '@/components/ui/autocomplete';

type FormType = UseFormReturn<
   HostInvitationFormInput,
   unknown,
   HostInvitationFormValues
>;

function VisitorFields({ form, index }: { form: FormType; index: number }) {
   const { t } = useTranslation();
   const errors = form.formState.errors.visitors?.[index];
   const [nationalityInput, setNationalityInput] = useState('');
   const nationalityValue = form.watch(`visitors.${index}.nationality`);
   const selectedNationality = NATIONALITY_OPTIONS.find(
      ({ value }) => value === nationalityValue,
   );
   const filteredNationalities = NATIONALITY_OPTIONS.filter(({ label }) =>
      label.toLowerCase().includes(nationalityInput.toLowerCase()),
   );

   return (
      <FieldGroup className="gap-4">
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
               <FieldLabel htmlFor={`visitors.${index}.firstName`}>
                  {t('common.firstName')}{' '}
                  <span className="text-destructive">*</span>
               </FieldLabel>
               <Input
                  id={`visitors.${index}.firstName`}
                  autoComplete="off"
                  placeholder={t('visitorForm.firstNamePlaceholder')}
                  aria-invalid={!!errors?.firstName}
                  {...form.register(`visitors.${index}.firstName`)}
               />
               <FieldError>{errors?.firstName?.message}</FieldError>
            </Field>

            <Field>
               <FieldLabel htmlFor={`visitors.${index}.lastName`}>
                  {t('common.lastName')}{' '}
                  <span className="text-destructive">*</span>
               </FieldLabel>
               <Input
                  id={`visitors.${index}.lastName`}
                  autoComplete="off"
                  placeholder={t('visitorForm.lastNamePlaceholder')}
                  aria-invalid={!!errors?.lastName}
                  {...form.register(`visitors.${index}.lastName`)}
               />
               <FieldError>{errors?.lastName?.message}</FieldError>
            </Field>
         </div>

         <Field>
            <FieldLabel htmlFor={`visitors.${index}.email`}>
               {t('common.email')} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
               id={`visitors.${index}.email`}
               type="email"
               autoComplete="off"
               placeholder={t('visitorForm.emailPlaceholder')}
               aria-invalid={!!errors?.email}
               {...form.register(`visitors.${index}.email`)}
            />
            <FieldDescription>
               {t('visitorForm.emailInviteHint')}
            </FieldDescription>
            <FieldError>{errors?.email?.message}</FieldError>
         </Field>

         <Field>
            <FieldLabel htmlFor={`visitors.${index}.phone`}>
               {t('common.phoneNumber')}{' '}
               <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
               name={`visitors.${index}.phone`}
               control={form.control}
               render={({ field }) => (
                  <Input
                     id={`visitors.${index}.phone`}
                     type="tel"
                     autoComplete="off"
                     placeholder={t('visitorForm.phonePlaceholder')}
                     aria-invalid={!!errors?.phone}
                     value={field.value ?? ''}
                     onChange={(e) =>
                        field.onChange(formatEthiopianPhone(e.target.value))
                     }
                     onBlur={field.onBlur}
                  />
               )}
            />
            <FieldError>{errors?.phone?.message}</FieldError>
         </Field>

         <Field>
            <FieldLabel htmlFor={`visitors.${index}.nationality`}>
               Nationality <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
               name={`visitors.${index}.nationality`}
               control={form.control}
               defaultValue={DEFAULT_NATIONALITY}
               render={({ field }) => (
                  <Autocomplete
                     key={nationalityValue ?? ''}
                     value={field.value || null}
                     onValueChange={(value) => field.onChange(value ?? '')}
                     onInputValueChange={setNationalityInput}
                     defaultInputValue={selectedNationality?.label ?? ''}
                  >
                     <AutocompleteInput
                        id={`visitors.${index}.nationality`}
                        placeholder="Search nationality..."
                        autoComplete="off"
                        showClear
                        aria-invalid={!!errors?.nationality}
                     />
                     <AutocompleteContent>
                        <AutocompleteList>
                           {filteredNationalities.length === 0 ? (
                              <AutocompleteEmpty>
                                 No nationality found.
                              </AutocompleteEmpty>
                           ) : (
                              filteredNationalities.map((nationality) => (
                                 <AutocompleteItem
                                    key={nationality.value}
                                    value={nationality.value}
                                    label={nationality.label}
                                 >
                                    {nationality.label}
                                 </AutocompleteItem>
                              ))
                           )}
                        </AutocompleteList>
                     </AutocompleteContent>
                  </Autocomplete>
               )}
            />
            <FieldError>{errors?.nationality?.message}</FieldError>
         </Field>

         <Field>
            <FieldLabel htmlFor={`visitors.${index}.organization`}>
               {t('visitDetails.organization')}
            </FieldLabel>
            <Input
               id={`visitors.${index}.organization`}
               autoComplete="off"
               placeholder={t('visitorForm.orgPlaceholder')}
               {...form.register(`visitors.${index}.organization`)}
            />
            <FieldError>{errors?.organization?.message}</FieldError>
         </Field>
      </FieldGroup>
   );
}

type InvitationVisitorsFieldsProps = {
   form: FormType;
   heading: string;
   description: string;
   maxVisitors?: number;
};

export function InvitationVisitorsFields({
   form,
   heading,
   description,
   maxVisitors,
}: InvitationVisitorsFieldsProps) {
   const { t } = useTranslation();
   const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: 'visitors',
   });

   return (
      <div className="space-y-4">
         <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
               <h3 className="text-sm font-medium text-foreground">
                  {heading}
               </h3>
               <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Button
               type="button"
               variant="outline"
               size="sm"
               className="shrink-0 cursor-pointer"
               disabled={
                  maxVisitors !== undefined && fields.length >= maxVisitors
               }
               onClick={() => append({ ...emptyInvitationVisitorValues })}
            >
               <Plus className="size-4" />
               {t('visitorForm.addVisitor')}
            </Button>
         </div>

         {fields.map((field, index) => (
            <FieldSet
               key={field.id}
               className="w-full rounded-lg border border-border p-4 sm:p-5"
            >
               <div className="mb-4 flex items-center justify-between gap-3">
                  <FieldLegend className="mb-0">
                     {t('visitorForm.visitorNumber', { number: index + 1 })}
                  </FieldLegend>
                  {fields.length > 1 && (
                     <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => remove(index)}
                     >
                        <Trash2 className="size-4" />
                        {t('visitorForm.remove')}
                     </Button>
                  )}
               </div>
               <VisitorFields form={form} index={index} />
            </FieldSet>
         ))}

         {form.formState.errors.visitors?.root?.message && (
            <FieldError>
               {form.formState.errors.visitors.root.message}
            </FieldError>
         )}
         {typeof form.formState.errors.visitors?.message === 'string' && (
            <FieldError>{form.formState.errors.visitors.message}</FieldError>
         )}
      </div>
   );
}
