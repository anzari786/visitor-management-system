'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CheckCircle2, Eye, EyeClosed, X } from 'lucide-react';
import * as React from 'react';

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
      text: 'At least 8 characters',
      test: (password: string) => password.length >= 8,
   },
   {
      text: 'Contains a number',
      test: (password: string) => /\d/.test(password),
   },
   {
      text: 'Contains uppercase letter',
      test: (password: string) => /[A-Z]/.test(password),
   },
] as const;

function getStrengthColor(score: number) {
   if (score === 0) return 'bg-muted';
   if (score === 1) return 'bg-red-500';
   if (score === 2) return 'bg-orange-500';
   return 'bg-teal-500';
}

function getStrengthText(score: number) {
   if (score === 0) return '';
   if (score === 1) return 'Weak';
   if (score === 2) return 'Moderate';
   return 'Strong';
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
   const [showPassword, setShowPassword] = React.useState(false);
   const password = typeof value === 'string' ? value : '';
   const results = validations.map((item) => ({
      text: item.text,
      valid: item.test(password),
   }));
   const strength = results.filter((item) => item.valid).length;

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
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
               >
                  {showPassword ? (
                     <Eye className="size-4 text-muted-foreground" />
                  ) : (
                     <EyeClosed className="size-4 text-muted-foreground" />
                  )}
               </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
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
                        Password must contain
                     </span>
                     <span className={getStrengthTextColor(strength)}>
                        {getStrengthText(strength)}
                     </span>
                  </div>
               </div>

               <div className="space-y-1.5 pt-1">
                  {results.map((validation) => (
                     <div
                        key={validation.text}
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
                        <span className="text-[13px]">{validation.text}</span>
                     </div>
                  ))}
               </div>
            </>
         )}
      </div>
   );
}
