'use client';

import { Controller, useFieldArray, type UseFormReturn } from 'react-hook-form';
import { formatEthiopianPhone } from '@/lib/phone';
import {
   emptyVisitorValues,
   type VisitRequestFormInput,
   type VisitRequestFormValues,
} from '@/lib/validations/visit-request.schema';
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
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

type FormType = UseFormReturn<
   VisitRequestFormInput,
   unknown,
   VisitRequestFormValues
>;

function VisitorFields({ form, index }: { form: FormType; index: number }) {
   const { t } = useTranslation();
   const errors = form.formState.errors.visitors?.[index];

   return (
      <FieldGroup>
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
               <FieldLabel htmlFor={`visitors.${index}.firstName`}>
                  {t('common.firstName')}{' '}
                  <span className="text-destructive">*</span>
               </FieldLabel>
               <Input
                  id={`visitors.${index}.firstName`}
                  autoComplete={index === 0 ? 'given-name' : 'off'}
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
                  autoComplete={index === 0 ? 'family-name' : 'off'}
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
               autoComplete={index === 0 ? 'email' : 'off'}
               placeholder={t('selfService.emailPlaceholder')}
               aria-invalid={!!errors?.email}
               {...form.register(`visitors.${index}.email`)}
            />
            {index === 0 && (
               <FieldDescription>{t('selfService.emailHint')}</FieldDescription>
            )}
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
                     autoComplete={index === 0 ? 'tel' : 'off'}
                     placeholder={t('selfService.phonePlaceholder')}
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
            <FieldLabel htmlFor={`visitors.${index}.organization`}>
               {t('visitDetails.organization')}
            </FieldLabel>
            <Input
               id={`visitors.${index}.organization`}
               autoComplete="organization"
               placeholder={t('selfService.orgPlaceholder')}
               {...form.register(`visitors.${index}.organization`)}
            />
            <FieldDescription>{t('selfService.orgHint')}</FieldDescription>
            <FieldError>{errors?.organization?.message}</FieldError>
         </Field>
      </FieldGroup>
   );
}

export function VisitorsStep({ form }: { form: FormType }) {
   const { t } = useTranslation();
   const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: 'visitors',
   });

   return (
      <div className="space-y-8">
         <FieldSet className="w-full">
            <FieldLegend>{t('selfService.primaryVisitor')}</FieldLegend>
            <FieldDescription>
               {t('selfService.primaryVisitorHint')}
            </FieldDescription>
            {fields[0] && <VisitorFields form={form} index={0} />}
         </FieldSet>

         <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
               <div className="space-y-1">
                  <h3 className="text-base font-medium text-foreground">
                     {t('selfService.additionalVisitors')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                     {t('selfService.additionalVisitorsHint')}
                  </p>
               </div>
               <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 cursor-pointer"
                  onClick={() => append({ ...emptyVisitorValues })}
               >
                  <Plus className="size-4" />
                  {t('visitorForm.addVisitor')}
               </Button>
            </div>

            {fields.length === 1 && (
               <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  {t('selfService.noAdditional')}
               </p>
            )}

            {fields.slice(1).map((field, offset) => {
               const index = offset + 1;
               return (
                  <FieldSet
                     key={field.id}
                     className="w-full rounded-lg border border-border p-4 sm:p-5"
                  >
                     <div className="mb-4 flex items-center justify-between gap-3">
                        <FieldLegend className="mb-0">
                           {t('visitorForm.visitorNumber', {
                              number: index + 1,
                           })}
                        </FieldLegend>
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
                     </div>
                     <VisitorFields form={form} index={index} />
                  </FieldSet>
               );
            })}

            {form.formState.errors.visitors?.root?.message && (
               <FieldError>
                  {form.formState.errors.visitors.root.message}
               </FieldError>
            )}
            {typeof form.formState.errors.visitors?.message === 'string' && (
               <FieldError>{form.formState.errors.visitors.message}</FieldError>
            )}
         </div>
      </div>
   );
}
