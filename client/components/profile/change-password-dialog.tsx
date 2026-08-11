'use client';

import { PasswordInput } from '@/components/profile/password-input';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogClose,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { useChangePassword } from '@/hooks/use-auth';
import {
   changePasswordSchema,
   type ChangePasswordFormValues,
} from '@/lib/validations/profile.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound } from 'lucide-react';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

type ChangePasswordDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
};

export function ChangePasswordDialog({
   open,
   onOpenChange,
}: ChangePasswordDialogProps) {
   const { mutateAsync: changePassword, isPending } = useChangePassword();

   const {
      control,
      handleSubmit,
      reset,
      formState: { errors },
   } = useForm<ChangePasswordFormValues>({
      resolver: zodResolver(changePasswordSchema),
      defaultValues: {
         currentPassword: '',
         newPassword: '',
         confirmPassword: '',
      },
   });

   React.useEffect(() => {
      if (open) {
         reset({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
         });
      }
   }, [open, reset]);

   const onSubmit = handleSubmit(async (values) => {
      try {
         await changePassword({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
         });
         toast.success('Password changed successfully');
         onOpenChange(false);
      } catch {
         toast.error('Failed to change password. Please try again.');
      }
   });

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            showCloseButton={false}
            className="sm:max-w-md data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 duration-300"
         >
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
               <div className="flex items-center gap-2">
                  <KeyRound size={16} className="text-primary" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                     Security
                  </span>
               </div>

               <DialogHeader>
                  <DialogTitle>Change password</DialogTitle>
                  <DialogDescription>
                     Choose a strong password to keep your VMS account secure.
                  </DialogDescription>
               </DialogHeader>

               <div className="flex flex-col gap-4">
                  <Controller
                     control={control}
                     name="currentPassword"
                     render={({ field }) => (
                        <PasswordInput
                           id="cp-current"
                           label="Current password"
                           placeholder="Enter current password"
                           autoComplete="current-password"
                           error={errors.currentPassword?.message}
                           {...field}
                        />
                     )}
                  />

                  <Controller
                     control={control}
                     name="newPassword"
                     render={({ field }) => (
                        <PasswordInput
                           id="cp-new"
                           label="New password"
                           placeholder="Enter new password"
                           autoComplete="new-password"
                           showStrength
                           error={errors.newPassword?.message}
                           {...field}
                        />
                     )}
                  />

                  <Controller
                     control={control}
                     name="confirmPassword"
                     render={({ field }) => (
                        <PasswordInput
                           id="cp-confirm"
                           label="Confirm new password"
                           placeholder="Re-enter new password"
                           autoComplete="new-password"
                           error={errors.confirmPassword?.message}
                           {...field}
                        />
                     )}
                  />
               </div>

               <div className="flex gap-2 pt-1">
                  <DialogClose asChild>
                     <Button
                        type="button"
                        variant="outline"
                        className="flex-1 cursor-pointer"
                        disabled={isPending}
                     >
                        Cancel
                     </Button>
                  </DialogClose>
                  <Button
                     type="submit"
                     className="flex-1 cursor-pointer"
                     disabled={isPending}
                  >
                     {isPending ? 'Updating…' : 'Update password'}
                  </Button>
               </div>
            </form>
         </DialogContent>
      </Dialog>
   );
}
