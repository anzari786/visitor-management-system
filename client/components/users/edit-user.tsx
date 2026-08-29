'use client';

import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { useUpdateUser } from '@/hooks/use-users';
import { getUserFullName } from '@/lib/user';
import { createUserSchema } from '@/lib/validations/user.schema';
import type { User } from '@/types/user.types';
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { KeyRound, ShieldCheck, Loader2, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const editUserSchema = createUserSchema.omit({ password: true });
type EditUserFormValues = z.infer<typeof editUserSchema>;

type EditUserProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   user: User;
};

const scrollAreaClass =
   'flex-1 space-y-8 overflow-y-auto px-6 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

const CIRCLE_RADIUS = 7;
const CIRCLE_LENGTH = 2 * Math.PI * CIRCLE_RADIUS;
const USERNAME_REGEX = /^[a-zA-Z0-9_]*$/;

const getStrokeColorClass = (p: number) => {
   if (p <= 0) return 'stroke-transparent';
   if (p <= 0.35) return 'stroke-red-500';
   if (p <= 0.7) return 'stroke-orange-500';
   return 'stroke-teal-400';
};

const AnimatedCheckmarkCircle = ({ progress }: { progress: number }) => {
   const isComplete = progress >= 1;
   return (
      <div className="relative flex items-center justify-center w-5 h-5 select-none">
         <svg width="20" height="20" className="-rotate-90">
            <circle
               cx="10"
               cy="10"
               r={CIRCLE_RADIUS}
               className="stroke-muted-foreground/20"
               strokeWidth="1.5"
               fill="transparent"
            />
            <motion.circle
               cx="10"
               cy="10"
               r={CIRCLE_RADIUS}
               className={cn(
                  'transition-colors duration-300',
                  getStrokeColorClass(progress),
               )}
               strokeWidth="1.5"
               fill="transparent"
               strokeDasharray={CIRCLE_LENGTH}
               initial={{ strokeDashoffset: CIRCLE_LENGTH }}
               animate={{
                  strokeDashoffset: CIRCLE_LENGTH - progress * CIRCLE_LENGTH,
               }}
               transition={{
                  duration: 0.35,
                  ease: 'easeInOut',
               }}
            />
            <motion.circle
               cx="10"
               cy="10"
               r={CIRCLE_RADIUS}
               className="fill-teal-400"
               style={{ transformOrigin: 'center' }}
               initial={{ scale: 0, opacity: 0 }}
               animate={{
                  scale: isComplete ? 1 : 0,
                  opacity: isComplete ? 1 : 0,
               }}
               transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  delay: isComplete ? 0.15 : 0,
               }}
            />
         </svg>
         <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
               initial={{ scale: 0, opacity: 0 }}
               animate={{
                  scale: isComplete ? 1 : 0,
                  opacity: isComplete ? 1 : 0,
               }}
               transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 15,
                  delay: isComplete ? 0.28 : 0,
               }}
            >
               <Check className="text-white size-3" strokeWidth={3} />
            </motion.div>
         </div>
      </div>
   );
};

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

export function EditUser({ open, onOpenChange, user }: EditUserProps) {
   const isSso = !!user.employee;
   const { mutateAsync: updateUser, isPending } = useUpdateUser();

   const {
      register,
      handleSubmit,
      control,
      reset,
      watch,
      formState: { errors },
   } = useForm<EditUserFormValues>({
      resolver: zodResolver(editUserSchema),
      defaultValues: {
         firstName: user.firstName,
         lastName: user.lastName,
         email: user.employee?.email ?? '',
         username: user.username,
         role: user.role,
      },
   });

   const usernameValue = watch('username');
   const isUsernameCharsValid = USERNAME_REGEX.test(usernameValue || '');
   const usernameProgress = isUsernameCharsValid
      ? Math.min((usernameValue || '').length / 3, 1.0)
      : 0.0;

   React.useEffect(() => {
      if (open) {
         reset({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.employee?.email ?? '',
            username: user.username,
            role: user.role,
         });
      }
   }, [open, reset, user]);

   const onSubmit = handleSubmit(async (values) => {
      try {
         await updateUser({
            id: user.id,
            firstName: values.firstName,
            lastName: values.lastName,
            username: values.username,
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
         <DialogContent
            aria-describedby={undefined}
            className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
         >
            <DialogHeader className="shrink-0 space-y-1.5 border-b px-6 py-5 text-left">
               <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>

            <form
               onSubmit={onSubmit}
               noValidate
               className="flex min-h-0 flex-1 flex-col"
            >
               <div className={scrollAreaClass}>
                  <FieldGroup className="gap-6">
                     <div className="space-y-4">
                        <SectionHeading
                           title={
                              isSso
                                 ? 'Employee Information'
                                 : 'User Information'
                           }
                           description={
                              isSso
                                 ? 'Details retrieved from organization directory.'
                                 : 'Basic profile details for the user.'
                           }
                        />

                        {isSso && user.employee ? (
                           <div className="rounded-xl border bg-muted/30 p-4 transition-all animate-in fade-in slide-in-from-top-2">
                              <div className="grid grid-cols-2 gap-y-3">
                                 <div className="space-y-0.5">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                       Full Name
                                    </p>
                                    <p className="text-sm font-medium">
                                       {user.employee.firstName}{' '}
                                       {user.employee.lastName}
                                    </p>
                                 </div>
                                 <div className="space-y-0.5">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                       Email
                                    </p>
                                    <p className="text-sm font-medium">
                                       {user.employee.email}
                                    </p>
                                 </div>
                                 <div className="space-y-0.5">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                       Department
                                    </p>
                                    <p className="text-sm font-medium">
                                       {user.employee.departmentName}
                                    </p>
                                 </div>
                                 <div className="space-y-0.5">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                       Job Title
                                    </p>
                                    <p className="text-sm font-medium">
                                       {user.employee.position || '—'}
                                    </p>
                                 </div>
                              </div>
                           </div>
                        ) : (
                           <>
                              {/* First / Last name row */}
                              <div className="grid grid-cols-2 gap-3">
                                 <Field>
                                    <FieldLabel htmlFor="edit-first-name">
                                       First Name
                                       <span className="text-destructive">
                                          *
                                       </span>
                                    </FieldLabel>
                                    <Input
                                       id="edit-first-name"
                                       aria-invalid={!!errors.firstName}
                                       {...register('firstName')}
                                    />
                                    {errors.firstName && (
                                       <FieldError>
                                          {errors.firstName.message}
                                       </FieldError>
                                    )}
                                 </Field>

                                 <Field>
                                    <FieldLabel htmlFor="edit-last-name">
                                       Last Name
                                       <span className="text-destructive">
                                          *
                                       </span>
                                    </FieldLabel>
                                    <Input
                                       id="edit-last-name"
                                       aria-invalid={!!errors.lastName}
                                       {...register('lastName')}
                                    />
                                    {errors.lastName && (
                                       <FieldError>
                                          {errors.lastName.message}
                                       </FieldError>
                                    )}
                                 </Field>
                              </div>

                              <Field>
                                 <FieldLabel htmlFor="edit-email">
                                    Email
                                    <span className="text-destructive">*</span>
                                 </FieldLabel>
                                 <Input
                                    id="edit-email"
                                    type="email"
                                    placeholder="email@example.com"
                                    aria-invalid={!!errors.email}
                                    {...register('email')}
                                 />
                                 {errors.email && (
                                    <FieldError>
                                       {errors.email.message}
                                    </FieldError>
                                 )}
                              </Field>

                              <Field>
                                 <FieldLabel htmlFor="edit-username">
                                    Username
                                    <span className="text-destructive">*</span>
                                 </FieldLabel>
                                 <FieldDescription>
                                    Min. 3 characters, alphanumeric &amp;
                                    underscores
                                 </FieldDescription>
                                 <div className="relative">
                                    <Input
                                       id="edit-username"
                                       type="text"
                                       className="bg-transparent pr-16 focus-visible:ring-1"
                                       aria-invalid={!!errors.username}
                                       {...register('username')}
                                    />

                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                       <AnimatedCheckmarkCircle
                                          progress={usernameProgress}
                                       />
                                    </div>
                                 </div>
                                 {errors.username && (
                                    <FieldError>
                                       {errors.username.message}
                                    </FieldError>
                                 )}
                              </Field>
                           </>
                        )}

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
                                       <SelectItem value="GUARD">
                                          Guard
                                       </SelectItem>
                                       <SelectItem value="RECEPTION">
                                          Reception
                                       </SelectItem>
                                       <SelectItem value="ADMIN">
                                          Administrator
                                       </SelectItem>
                                       <SelectItem value="MANAGER">
                                          Manager
                                       </SelectItem>
                                    </SelectContent>
                                 </Select>
                              )}
                           />
                           {errors.role && (
                              <FieldError>{errors.role.message}</FieldError>
                           )}
                        </Field>
                     </div>

                     <div className="space-y-4">
                        <SectionHeading
                           title="Authentication"
                           description="How this user will sign in to the system."
                        />
                        <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
                           <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary">
                              {isSso ? (
                                 <ShieldCheck className="size-4" />
                              ) : (
                                 <KeyRound className="size-4" />
                              )}
                           </div>
                           <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">
                                 {isSso
                                    ? 'SSO Authentication'
                                    : 'Local Account'}
                              </p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                 {isSso
                                    ? "Uses your organization's identity provider (e.g., Azure AD, Okta). The user will sign in using their existing work credentials."
                                    : 'Uses username and password authentication. The user will be prompted to set their password upon first login or via a reset link.'}
                              </p>
                           </div>
                        </div>
                     </div>
                  </FieldGroup>
               </div>

               <DialogFooter className="shrink-0 gap-2 border-t px-6 py-4 sm:justify-end">
                  <Button
                     type="button"
                     variant="outline"
                     className="cursor-pointer"
                     disabled={isPending}
                     onClick={() => onOpenChange(false)}
                  >
                     Cancel
                  </Button>
                  <Button
                     type="submit"
                     className="cursor-pointer gap-2"
                     disabled={isPending}
                  >
                     {isPending ? (
                        <>
                           <Loader2 className="size-4 animate-spin" />
                           Saving…
                        </>
                     ) : (
                        'Save Changes'
                     )}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
