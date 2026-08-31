'use client';

import { Button } from '@/components/ui/button';
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from '@/components/ui/card';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { PasswordInput } from '@/components/profile/password-input';
import {
   useCompletePasswordSetup,
   useForceChangePassword,
} from '@/hooks/use-auth';
import {
   forceChangePasswordSchema,
   type ForceChangePasswordFormValues,
} from '@/lib/validations/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2Icon, Clock3, KeyRound, Link2Off } from 'lucide-react';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import type { ApiErrorResponse } from '@/types/api.types';
import { useAuthStore } from '@/store/auth-store';
import Image from 'next/image';

type ResultState = 'success' | 'expired' | 'invalid' | null;

const SetPassword = () => {
   const router = useRouter();
   const user = useAuthStore((state) => state.user);
   const [setupToken, setSetupToken] = useState<string | null>(null);
   const [resultState, setResultState] = useState<ResultState>(null);
   const { mutateAsync: forceChangePassword, isPending: isForcePending } =
      useForceChangePassword({ redirectOnSuccess: false });
   const { mutateAsync: completePasswordSetup, isPending: isSetupPending } =
      useCompletePasswordSetup();
   const isPending = isForcePending || isSetupPending;

   // Guard: if user doesn't need to change password, send them to dashboard
   useEffect(() => {
      if (user && !user.mustChangePassword) {
         router.replace('/');
      }
   }, [user, router]);

   useEffect(() => {
      setSetupToken(new URLSearchParams(window.location.search).get('token'));
   }, []);

   const {
      control,
      handleSubmit,
      formState: { errors },
   } = useForm<ForceChangePasswordFormValues>({
      resolver: zodResolver(forceChangePasswordSchema),
      defaultValues: {
         newPassword: '',
         confirmPassword: '',
      },
   });

   const onSubmit = handleSubmit(async (values) => {
      if (!setupToken) {
         await forceChangePassword(values, {
            onSuccess: () => setResultState('success'),
         });
         return;
      }

      try {
         await completePasswordSetup({
            token: setupToken,
            password: values.newPassword,
         });
         setResultState('success');
      } catch (error) {
         const code =
            error instanceof AxiosError
               ? (error.response?.data as ApiErrorResponse | undefined)?.code
               : undefined;
         setResultState(code === 'EXPIRED_SETUP_TOKEN' ? 'expired' : 'invalid');
      }
   });

   const resultCopy = {
      success: {
         title: 'Password set successfully',
         description:
            'Your ATI VMS account is ready. You can now sign in with your new password.',
         icon: CheckCircle2Icon,
         iconClass: 'bg-teal-400/10 text-teal-400',
         action: 'Go to Login',
      },
      expired: {
         title: 'Password setup link expired',
         description:
            'This password setup link is no longer valid. Please request a new link from your administrator.',
         icon: Clock3,
         iconClass: 'bg-amber-400/10 text-amber-500',
         action: 'Go to Login',
      },
      invalid: {
         title: 'Invalid password setup link',
         description:
            'This password setup link is invalid or has already been used. Please request a new link from your administrator.',
         icon: Link2Off,
         iconClass: 'bg-rose-400/10 text-rose-500',
         action: 'Go to Login',
      },
   } as const;
   const result = resultState ? resultCopy[resultState] : null;
   const ResultIcon = result?.icon;

   return (
      <>
         <div className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
            <Card className="mx-auto w-full max-w-md rounded-4xl border border-border bg-card/85 px-4 py-8 pt-12 shadow-2xs shadow-primary/10 backdrop-blur-xl sm:px-6 sm:py-10 sm:pt-14">
               <CardHeader className=" px-0 pb-1.5 text-center sm:pb-3">
                  <Image
                     src="/logo.png"
                     alt="ATI Logo"
                     width={96}
                     height={96}
                     priority
                     className="mx-auto block h-12 w-12 object-contain sm:h-14 sm:w-14"
                  />
                  <CardTitle className="text-balance text-xl font-semibold text-foreground sm:text-2xl">
                     Create your password
                  </CardTitle>
                  <CardDescription className="text-pretty text-sm text-muted-foreground">
                     Create a secure password to complete your ATI VMS account
                     setup.
                  </CardDescription>
               </CardHeader>
               <CardContent className="px-0">
                  <form onSubmit={onSubmit} className="grid gap-5 sm:gap-6">
                     <div className="flex flex-col gap-4">
                        <Controller
                           control={control}
                           name="newPassword"
                           render={({ field }) => (
                              <PasswordInput
                                 id="set-password-new"
                                 label="New password"
                                 placeholder="Enter your new password"
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
                                 id="set-password-confirm"
                                 label="Confirm password"
                                 placeholder="Re-enter your new password"
                                 autoComplete="new-password"
                                 error={errors.confirmPassword?.message}
                                 {...field}
                              />
                           )}
                        />
                     </div>

                     <Button
                        type="submit"
                        className="w-full"
                        disabled={isPending}
                     >
                        {isPending ? 'Creating password…' : 'Create password'}
                     </Button>
                  </form>
               </CardContent>
            </Card>
         </div>
         <Dialog
            open={resultState !== null}
            onOpenChange={(open) => !open && setResultState(null)}
         >
            <DialogContent
               className="sm:max-w-xs data-open:zoom-in-50! data-closed:zoom-out-50 duration-300 [[data-slot=dialog-overlay]:has(~_&)]:duration-300"
               showCloseButton={false}
            >
               {result && ResultIcon ? (
                  <div className="flex flex-col items-center gap-4 py-2 text-center">
                     <div
                        className={`flex size-16 items-center justify-center rounded-full ${result.iconClass}`}
                     >
                        <ResultIcon size={32} strokeWidth={1.5} />
                     </div>
                     <DialogHeader className="items-center">
                        <DialogTitle className="text-lg">
                           {result.title}
                        </DialogTitle>
                        <DialogDescription>
                           {result.description}
                        </DialogDescription>
                     </DialogHeader>
                     <Button
                        type="button"
                        className="w-full cursor-pointer hover:bg-primary/80"
                        onClick={() => router.push('/login')}
                     >
                        {result.action}
                     </Button>
                  </div>
               ) : null}
            </DialogContent>
         </Dialog>
      </>
   );
};

export default SetPassword;
