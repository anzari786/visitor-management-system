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
   FieldDescription,
   FieldError,
   FieldGroup,
   FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
   createUserSchema,
   type CreateUserFormValues,
} from '@/lib/validations/user.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Badge } from '../reui/badge';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '../ui/select';
import { USER_ROLE_CONFIG, USER_ROLES } from '@/constants/user';
import { formatEthiopianPhone } from '@/lib/phone';

type CreateUserProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSubmit?: (values: CreateUserFormValues) => void | Promise<void>;
};

const CreateUser = ({ open, onOpenChange, onSubmit }: CreateUserProps) => {
   const {
      register,
      handleSubmit,
      control,
      reset,
      formState: { errors, isSubmitting },
   } = useForm<CreateUserFormValues>({
      resolver: zodResolver(createUserSchema),
      defaultValues: {
         firstName: '',
         lastName: '',
         username: '',
         phone: '+251 ',
         role: 'RECEPTION',
         password: '',
      },
   });

   // Reset form whenever dialog is opened
   React.useEffect(() => {
      if (open) {
         reset();
      }
   }, [open, reset]);

   const handleFormSubmit = handleSubmit(async (values) => {
      await onSubmit?.(values);
      onOpenChange(false);
   });

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-120 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle>Create User</DialogTitle>
               <DialogDescription className="sr-only" />
            </DialogHeader>

            <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
               <FieldGroup>
                  {/* First / Last name row */}
                  <div className="grid grid-cols-2 gap-3">
                     <Field>
                        <FieldLabel htmlFor="first-name">
                           First Name
                           <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                           id="first-name"
                           aria-invalid={!!errors.firstName}
                           {...register('firstName')}
                        />
                        {errors.firstName && (
                           <FieldError>{errors.firstName.message}</FieldError>
                        )}
                     </Field>

                     <Field>
                        <FieldLabel htmlFor="last-name">
                           Last Name
                           <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                           id="last-name"
                           aria-invalid={!!errors.lastName}
                           {...register('lastName')}
                        />
                        {errors.lastName && (
                           <FieldError>{errors.lastName.message}</FieldError>
                        )}
                     </Field>
                  </div>

                  {/* Username */}
                  <Field>
                     <FieldLabel htmlFor="username">
                        Username
                        <span className="text-destructive">*</span>
                     </FieldLabel>
                     <FieldDescription>
                        Choose a unique username for the account.
                     </FieldDescription>
                     <Input
                        id="username"
                        type="text"
                        aria-invalid={!!errors.username}
                        {...register('username')}
                     />

                     {errors.username && (
                        <FieldError>{errors.username.message}</FieldError>
                     )}
                  </Field>

                  {/* Phone (optional) */}
                  <Field>
                     <div className="flex items-center justify-between gap-2">
                        <FieldLabel htmlFor="phone">Phone</FieldLabel>
                        <Badge variant="warning-outline" size="sm">
                           Optional
                        </Badge>
                     </div>
                     <Controller
                        name="phone"
                        control={control}
                        render={({ field }) => (
                           <Input
                              id="phone"
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

                  {/* Role */}
                  <Field>
                     <FieldLabel htmlFor="role">
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
                                 id="role"
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

                  {/* Password */}
                  <Field>
                     <FieldLabel htmlFor="password">
                        Password
                        <span className="text-destructive">*</span>
                     </FieldLabel>
                     <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        aria-invalid={!!errors.password}
                        {...register('password')}
                     />
                     {errors.password && (
                        <FieldError>{errors.password.message}</FieldError>
                     )}
                  </Field>
               </FieldGroup>

               <DialogFooter>
                  <DialogClose asChild>
                     <Button type="button" variant="outline">
                        Cancel
                     </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                     {isSubmitting ? 'Creating…' : 'Create User'}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
};

export default CreateUser;
