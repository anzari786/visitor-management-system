'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CheckCircle2, Eye, EyeClosed, X } from 'lucide-react';
import * as React from 'react';
import { useTranslation, type TranslationKey } from '@/lib/i18n';

type PasswordInputProps = Omit<
   React.ComponentProps<typeof Input>,
   'type'
> & {
   label: string;
   showStrength?: boolean;
   error?: string;
};

const validations = [
   {
      textKey: 'password.ruleMinLength',
      test: (password: string) => password.length >= 8,
   },
   {
      textKey: 'password.ruleNumber',
      test: (password: string) => /\d/.test(password),
   },
   {
      textKey: 'password.ruleUppercase',
      test: (password: string) => /[A-Z]/.test(password),
   },
] as const satisfies readonly {
   textKey: TranslationKey;
   test: (password: string) => boolean;
}[];

function getStrengthColor(score: number) {
   if (score === 0) return 'bg-muted';
   if (score === 1) return 'bg-red-500';
   if (score === 2) return 'bg-orange-500';
   return 'bg-teal-500';
}

function getStrengthTextKey(score: number): TranslationKey | null {
   if (score === 0) return null;
   if (score === 1) return 'password.strengthWeak';
   if (score === 2) return 'password.strengthModerate';
   return 'password.strengthStrong';
}

function getStrengthTextColor(score: number) {
   if (score === 0) return 'text-muted-foreground';
   if (score === 1) return 'text-red-500';
   if (score === 2) return 'text-orange-500';
   return 'text-teal-500';
}

export function PasswordInput({
   label,
   id,
   value,
   showStrength = false,
   error,
   className,
   ...props
}: PasswordInputProps) {
   const { t } = useTranslation();
   const [showPassword, setShowPassword] = React.useState(false);
   const password = typeof value === 'string' ? value : '';
   const results = validations.map((item) => ({
      textKey: item.textKey,
      valid: item.test(password),
   }));
   const strength = results.filter((item) => item.valid).length;
   const strengthKey = getStrengthTextKey(strength);

   return (
      <div className="w-full space-y-3">
         <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
               <Input
                  id={id}
                  type={showPassword ? 'text' : 'password'}
                  value={value}
                  className={cn('bg-transparent pr-10', className)}
                  aria-invalid={!!error}
                  {...props}
               />
               <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={t(
                     showPassword
                        ? 'password.hidePassword'
                        : 'password.showPassword',
                  )}
               >
                  {showPassword ? (
                     <Eye className="size-4 text-muted-foreground" />
                  ) : (
                     <EyeClosed className="size-4 text-muted-foreground" />
                  )}
               </Button>
            </div>
            {error && (
               <p className="text-sm text-destructive">
                  {t(error as TranslationKey)}
               </p>
            )}
         </div>

         {showStrength && (
            <>
               <div className="space-y-2">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                     <div
                        className={cn(
                           'h-full transition-all duration-500 ease-out',
                           getStrengthColor(strength),
                        )}
                        style={{
                           width: `${(strength / validations.length) * 100}%`,
                        }}
                     />
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium">
                     <span className="text-muted-foreground">
                        {t('password.mustContain')}
                     </span>
                     <span className={getStrengthTextColor(strength)}>
                        {strengthKey ? t(strengthKey) : ''}
                     </span>
                  </div>
               </div>

               <div className="space-y-1.5 pt-1">
                  {results.map((validation) => (
                     <div
                        key={validation.textKey}
                        className={cn(
                           'flex items-center gap-2 text-sm transition-colors duration-200',
                           validation.valid
                              ? 'text-teal-600 dark:text-teal-400'
                              : 'text-muted-foreground',
                        )}
                     >
                        {validation.valid ? (
                           <CheckCircle2 className="size-3.5" />
                        ) : (
                           <X className="size-3.5" />
                        )}
                        <span className="text-[13px]">
                           {t(validation.textKey)}
                        </span>
                     </div>
                  ))}
               </div>
            </>
         )}
      </div>
   );
}
