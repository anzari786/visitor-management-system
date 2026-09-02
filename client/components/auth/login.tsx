'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/hooks/use-auth';
import {
   loginSchema,
   type LoginFormValues,
} from '@/lib/validations/auth.schema';
import { ApiErrorResponse } from '@/types/api.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { Eye, EyeClosed, Lock, User } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Separator } from '../ui/separator';
import LanguageDropdown from '@/components/shared/language-dropdown';
import { useTranslation, type TranslationKey } from '@/lib/i18n';

export default function Login() {
   const { t } = useTranslation();
   const [isPasswordVisible, setIsPasswordVisible] = useState(false);

   const { mutate: login, isPending } = useLogin();

   const {
      register,
      handleSubmit,
      setValue,
      setFocus,
      formState: { errors },
   } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

   const onSubmit = (values: LoginFormValues) => {
      login(values, {
         onError: (error: AxiosError<ApiErrorResponse>) => {
            const code = error.response?.data?.code;

            if (code === 'INVALID_USERNAME') {
               setValue('username', '', { shouldDirty: true });
               setFocus('username');
            } else {
               setValue('password', '', { shouldDirty: true });
               setFocus('password');
            }
         },
      });
   };

   return (
      <Card className="w-full rounded-4xl border border-border bg-card/85 px-6 py-10 pt-14 shadow-2xs shadow-primary/10 backdrop-blur-xl">
         <div className="flex flex-col items-center space-y-8">
            <div className="flex w-full justify-end">
               <LanguageDropdown align="end" />
            </div>

            {/* Title */}
            <div className="space-y-2 text-center">
               <Image
                  src="/logo.png"
                  alt="ATI Logo"
                  width={96}
                  height={96}
                  priority
                  className="mx-auto block h-12 w-12 object-contain sm:h-14 sm:w-14"
               />
               <h1 className="text-balance font-semibold text-xl text-foreground sm:text-2xl">
                  {t('auth.login.heading')}
               </h1>
               <p className="text-sm text-pretty text-muted-foreground">
                  {t('auth.login.subheading')}
               </p>
            </div>

            {/* Form */}
            <form
               onSubmit={handleSubmit(onSubmit)}
               className="w-full space-y-4"
            >
               {/* Username Input */}
               <div className="space-y-2">
                  <Label htmlFor="username" className="ml-1 text-foreground">
                     {t('auth.login.username')}
                  </Label>
                  <div className="relative">
                     <Input
                        id="username"
                        type="text"
                        placeholder={t('auth.login.usernamePlaceholder')}
                        aria-invalid={!!errors.username}
                        {...register('username')}
                        className="rounded-xl border-input bg-background ps-9 text-sm text-foreground shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30"
                     />
                     <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground">
                        <User aria-hidden="true" className="h-4 w-4" />
                     </div>
                  </div>
                  {errors.username && (
                     <p className="ml-3 text-xs font-medium text-destructive">
                        {t(errors.username.message as TranslationKey)}
                     </p>
                  )}
               </div>

               {/* Password Input */}
               <div className="space-y-2">
                  <Label htmlFor="password" className="ml-1 text-foreground">
                     {t('auth.login.password')}
                  </Label>
                  <div className="relative">
                     <Input
                        id="password"
                        type={isPasswordVisible ? 'text' : 'password'}
                        placeholder={t('auth.login.passwordPlaceholder')}
                        aria-invalid={!!errors.password}
                        {...register('password')}
                        className="rounded-xl border-input bg-background ps-9 pe-9 text-sm text-foreground shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30"
                     />
                     <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground">
                        <Lock aria-hidden="true" className="h-4 w-4" />
                     </div>
                     <Button
                        aria-controls="password"
                        aria-label={
                           isPasswordVisible
                              ? t('auth.login.hidePassword')
                              : t('auth.login.showPassword')
                        }
                        aria-pressed={isPasswordVisible}
                        className="absolute top-0 right-0 h-full px-3 hover:bg-transparent cursor-pointer"
                        onClick={() => setIsPasswordVisible((v) => !v)}
                        size="icon"
                        type="button"
                        variant="ghost"
                     >
                        {isPasswordVisible ? (
                           <Eye className="h-4 w-4 text-muted-foreground" />
                        ) : (
                           <EyeClosed className="h-4 w-4 text-muted-foreground" />
                        )}
                     </Button>
                  </div>
                  {errors.password && (
                     <p className="ml-3 text-xs font-medium text-red-500">
                        {t(errors.password.message as TranslationKey)}
                     </p>
                  )}
               </div>

               {/* Submit Action Button */}
               <Button
                  type="submit"
                  disabled={isPending}
                  size="lg"
                  className="mt-2 w-full rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 active:bg-primary/80 disabled:opacity-50"
               >
                  <span>
                     {isPending
                        ? t('auth.login.submitting')
                        : t('auth.login.submit')}
                  </span>
               </Button>

               <div className="flex items-center gap-4 py-2">
                  <Separator className="flex-1" />
                  <span className="text-muted-foreground text-sm">
                     {t('auth.login.or')}
                  </span>
                  <Separator className="flex-1" />
               </div>

               <Button
                  className="w-full rounded-xl"
                  size="lg"
                  variant="outline"
               >
                  {t('auth.login.sso')}
               </Button>
            </form>

            {/* Footer Notice */}
            <div className="text-pretty text-center text-muted-foreground text-xs">
               <p>
                  {t('auth.login.footerOrg')}
               </p>
               <p>{t('nav.brandSubtitle')}</p>
            </div>
         </div>
      </Card>
   );
}
