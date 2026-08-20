'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
   Field,
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
import {
   DEMO_INVITATION_PREVIEW,
   DEMO_INVITATION_TOKEN,
} from '@/lib/demo-invitation';
import {
   visitInvitationService,
   type InvitationPreview,
} from '@/services/visit-invitation.service';

const registrationSchema = z.object({
   firstName: z.string().trim().min(1, 'First name is required'),
   lastName: z.string().trim().min(1, 'Last name is required'),
   phone: z.string().trim().min(7, 'Phone is required'),
   email: z.string().trim().email().optional().or(z.literal('')),
   organization: z.string().trim().optional(),
   idType: z.enum([
      'NATIONAL_ID',
      'PASSPORT',
      'DRIVERS_LICENSE',
      'KEBELE_ID',
      'OTHER',
   ]),
   idNumber: z.string().trim().min(1, 'ID number is required'),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

export function VisitorRegistrationContent() {
   const params = useParams<{ token: string }>();
   const token = params.token;
   const [preview, setPreview] = useState<InvitationPreview | null>(null);
   const [loading, setLoading] = useState(true);
   const [submitted, setSubmitted] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const form = useForm<RegistrationFormValues>({
      resolver: zodResolver(registrationSchema),
      defaultValues: {
         firstName: '',
         lastName: '',
         phone: '',
         email: '',
         organization: '',
         idType: 'NATIONAL_ID',
         idNumber: '',
      },
   });

   useEffect(() => {
      if (!token) return;

      if (token === DEMO_INVITATION_TOKEN) {
         setPreview(DEMO_INVITATION_PREVIEW);
         if (DEMO_INVITATION_PREVIEW.organization) {
            form.setValue(
               'organization',
               DEMO_INVITATION_PREVIEW.organization,
            );
         }
         setLoading(false);
         return;
      }

      visitInvitationService
         .getInvitationPreview(token)
         .then(({ data }) => {
            setPreview(data.data);
            if (data.data.organization) {
               form.setValue('organization', data.data.organization);
            }
         })
         .catch(() => {
            setError('This invitation link is invalid or has expired.');
         })
         .finally(() => setLoading(false));
   }, [token, form]);

   const onSubmit = form.handleSubmit(async (values) => {
      if (!token) return;

      if (token === DEMO_INVITATION_TOKEN) {
         setSubmitted(true);
         toast.success('Registration complete (demo)');
         return;
      }

      try {
         await visitInvitationService.registerViaInvitation(token, {
            ...values,
            email: values.email || undefined,
            organization: values.organization || undefined,
         });
         setSubmitted(true);
         toast.success('Registration complete');
      } catch (err) {
         const message =
            err instanceof Error
               ? err.message
               : 'Registration failed. Please try again.';
         toast.error(message);
      }
   });

   if (loading) {
      return (
         <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
         </div>
      );
   }

   if (error || !preview) {
      return (
         <div className="mx-auto max-w-lg px-4 py-16 text-center">
            <h1 className="text-xl font-semibold">Invitation unavailable</h1>
            <p className="mt-2 text-muted-foreground">
               {error ?? 'Unable to load this invitation.'}
            </p>
         </div>
      );
   }

   if (submitted) {
      return (
         <div className="mx-auto max-w-lg px-4 py-16 text-center">
            <h1 className="text-xl font-semibold">You are registered</h1>
            <p className="mt-2 text-muted-foreground">
               Your registration for visit {preview.visitCode} is confirmed.
               Please bring your ID when you arrive.
            </p>
         </div>
      );
   }

   if (!preview.isActive || preview.isFull) {
      return (
         <div className="mx-auto max-w-lg px-4 py-16 text-center">
            <h1 className="text-xl font-semibold">Registration closed</h1>
            <p className="mt-2 text-muted-foreground">
               {preview.isFull
                  ? 'All visitor slots for this visit have been filled.'
                  : 'This invitation is no longer accepting registrations.'}
            </p>
         </div>
      );
   }

   return (
      <div className="mx-auto max-w-lg px-4 py-10">
         <div className="mb-8 space-y-2">
            <h1 className="text-2xl font-semibold">Visitor Registration</h1>
            <p className="text-sm text-muted-foreground">
               Visit {preview.visitCode}
               {preview.hostName ? ` · Host: ${preview.hostName}` : ''}
            </p>
            <p className="text-sm text-muted-foreground">
               {preview.registeredCount} of {preview.expectedVisitorCount}{' '}
               visitors registered
            </p>
         </div>

         <form onSubmit={onSubmit} noValidate className="space-y-6">
            <FieldGroup className="gap-4">
               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                     <FieldLabel htmlFor="firstName">First name</FieldLabel>
                     <Input id="firstName" {...form.register('firstName')} />
                     <FieldError>
                        {form.formState.errors.firstName?.message}
                     </FieldError>
                  </Field>
                  <Field>
                     <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                     <Input id="lastName" {...form.register('lastName')} />
                     <FieldError>
                        {form.formState.errors.lastName?.message}
                     </FieldError>
                  </Field>
               </div>

               <Field>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input id="phone" {...form.register('phone')} />
                  <FieldError>{form.formState.errors.phone?.message}</FieldError>
               </Field>

               <Field>
                  <FieldLabel htmlFor="email">Email (optional)</FieldLabel>
                  <Input id="email" type="email" {...form.register('email')} />
                  <FieldError>{form.formState.errors.email?.message}</FieldError>
               </Field>

               <Field>
                  <FieldLabel htmlFor="organization">
                     Organization (optional)
                  </FieldLabel>
                  <Input
                     id="organization"
                     {...form.register('organization')}
                  />
               </Field>

               <Field>
                  <FieldLabel>ID type</FieldLabel>
                  <Select
                     value={form.watch('idType')}
                     onValueChange={(value) =>
                        form.setValue(
                           'idType',
                           value as RegistrationFormValues['idType'],
                        )
                     }
                  >
                     <SelectTrigger>
                        <SelectValue placeholder="Select ID type" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                        <SelectItem value="PASSPORT">Passport</SelectItem>
                        <SelectItem value="DRIVERS_LICENSE">
                           Driver&apos;s License
                        </SelectItem>
                        <SelectItem value="KEBELE_ID">Kebele ID</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                     </SelectContent>
                  </Select>
               </Field>

               <Field>
                  <FieldLabel htmlFor="idNumber">ID number</FieldLabel>
                  <Input id="idNumber" {...form.register('idNumber')} />
                  <FieldError>
                     {form.formState.errors.idNumber?.message}
                  </FieldError>
               </Field>
            </FieldGroup>

            <Button
               type="submit"
               className="w-full cursor-pointer"
               disabled={form.formState.isSubmitting}
            >
               {form.formState.isSubmitting ? (
                  <>
                     <Loader2 className="mr-2 size-4 animate-spin" />
                     Registering...
                  </>
               ) : (
                  'Complete Registration'
               )}
            </Button>
         </form>
      </div>
   );
}
