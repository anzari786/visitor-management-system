'use client';

import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogClose,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { useUpdateUser } from '@/hooks/use-users';
import { formatEthiopianPhone } from '@/lib/phone';
import { USER_ROLE_CONFIG, USER_ROLES } from '@/constants/user';
import { getUserFullName } from '@/lib/user';
import { createUserSchema } from '@/lib/validations/user.schema';
import type { User } from '@/types/user.types';
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const editUserSchema = createUserSchema.omit({ password: true });
type EditUserFormValues = z.infer<typeof editUserSchema>;

type EditUserProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   user: User;
};

export function EditUser({ open, onOpenChange, user }: EditUserProps) {
   const { mutateAsync: updateUser, isPending } = useUpdateUser();

   const {
      register,
      handleSubmit,
      control,
      reset,
      formState: { errors },
   } = useForm<EditUserFormValues>({
      resolver: zodResolver(editUserSchema),
      defaultValues: {
         firstName: user.firstName,
         lastName: user.lastName,
         username: user.username,
         phone: user.phone ?? '+251 ',
         role: user.role,
      },
   });

   React.useEffect(() => {
      if (open) {
         reset({
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            phone: user.phone ?? '+251 ',
            role: user.role,
         });
      }
   }, [open, reset, user]);

   const onSubmit = handleSubmit(async (values) => {
      try {
         const phone =
            !values.phone || values.phone === '+251 '
               ? undefined
               : values.phone;

         await updateUser({
            id: user.id,
            firstName: values.firstName,
            lastName: values.lastName,
            username: values.username,
            phone,
            role: values.role,
         });

         toast.success(`${getUserFullName(user)} updated`);
         onOpenChange(false);
      } catch {
         toast.error('Failed to update user. Please try again.');
      }
   });

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-120 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle>Edit User</DialogTitle>
               <DialogDescription className="sr-only" />
            </DialogHeader>

            <form onSubmit={onSubmit} className="space-y-4 pt-2">
               <FieldGroup>
                  <div className="grid grid-cols-2 gap-3">
                     <Field>
                        <FieldLabel htmlFor="edit-first-name">
                           First Name
                           <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                           id="edit-first-name"
                           aria-invalid={!!errors.firstName}
                           {...register('firstName')}
                        />
                        {errors.firstName && (
                           <FieldError>{errors.firstName.message}</FieldError>
                        )}
                     </Field>

                     <Field>
                        <FieldLabel htmlFor="edit-last-name">
                           Last Name
                           <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                           id="edit-last-name"
                           aria-invalid={!!errors.lastName}
                           {...register('lastName')}
                        />
                        {errors.lastName && (
                           <FieldError>{errors.lastName.message}</FieldError>
                        )}
                     </Field>
                  </div>

                  <Field>
                     <FieldLabel htmlFor="edit-username">
                        Username
                        <span className="text-destructive">*</span>
                     </FieldLabel>
                     <Input
                        id="edit-username"
                        aria-invalid={!!errors.username}
                        {...register('username')}
                     />
                     {errors.username && (
                        <FieldError>{errors.username.message}</FieldError>
                     )}
                  </Field>

                  <Field>
                     <FieldLabel htmlFor="edit-phone">Phone</FieldLabel>
                     <Controller
                        name="phone"
                        control={control}
                        render={({ field }) => (
                           <Input
                              id="edit-phone"
                              type="tel"
                              placeholder="+251 9XX XXX XXX"
                              aria-invalid={!!errors.phone}
                              value={field.value}
                              onChange={(e) =>
                                 field.onChange(
                                    formatEthiopianPhone(e.target.value),
                                 )
                              }
                           />
                        )}
                     />
                     {errors.phone && (
                        <FieldError>{errors.phone.message}</FieldError>
                     )}
                  </Field>

                  <Field>
                     <FieldLabel htmlFor="edit-role">
                        Role
                        <span className="text-destructive">*</span>
                     </FieldLabel>
                     <Controller
                        name="role"
                        control={control}
                        render={({ field }) => (
                           <Select
                              value={field.value}
                              onValueChange={field.onChange}
                           >
                              <SelectTrigger
                                 id="edit-role"
                                 aria-invalid={!!errors.role}
                              >
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 {USER_ROLES.map((role) => (
                                    <SelectItem key={role} value={role}>
                                       {USER_ROLE_CONFIG[role].label}
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        )}
                     />
                     {errors.role && (
                        <FieldError>{errors.role.message}</FieldError>
                     )}
                  </Field>
               </FieldGroup>

               <DialogFooter>
                  <DialogClose asChild>
                     <Button type="button" variant="outline">
                        Cancel
                     </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isPending}>
                     {isPending ? 'Saving…' : 'Save Changes'}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
