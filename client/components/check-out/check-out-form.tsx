'use client';

import { Button } from '@/components/ui/button';
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
   CheckOutFormValues,
   checkOutSchema,
} from '@/lib/validations/check-out.schema';
import type { BadgeLookupResponse } from '@/types/visit.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import {
   Check,
   ChevronLeft,
   ChevronRight,
   CircleAlertIcon,
} from 'lucide-react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import useMeasure from 'react-use-measure';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '../reui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { useActiveBadge, useCheckOutVisit } from '@/hooks/use-visits';
import { useTranslation, type TranslationKey } from '@/lib/i18n';

const STEP_FIELDS: (keyof CheckOutFormValues)[][] = [
   ['badgeNumber'],
   ['notes'],
];

const STEP_TITLES = [
   {
      title: 'Badge Verification',
      description: "Verify the visitor's badge before checking out.",
   },
   {
      title: 'Visitor Information',
      description: 'Confirm visitor details and add any checkout notes.',
   },
];

function buildSummary(data?: BadgeLookupResponse) {
   return [
      {
         label: 'Visitor Name',
         value: data?.visitorName ?? '—',
      },
      { label: 'Badge', value: data?.badge ?? '—' },
      {
         label: 'Host',
         value: data?.host ?? '—',
      },
      {
         label: 'Department',
         value: data?.department ?? '—',
      },
      {
         label: 'Check-In Time',
         value: data?.checkInTime
            ? format(new Date(data.checkInTime), 'PPp')
            : '—',
      },
      {
         label: 'Check-Out Time',
         value: format(new Date(), 'PPp'),
      },
   ];
}

const VisitorCheckOutForm = () => {
   const { t } = useTranslation();
   const [currentStep, setCurrentStep] = useState(0);
   const [direction, setDirection] = useState<number>();
   const [typedDigits, setTypedDigits] = useState('');
   const [ref, bounds] = useMeasure();

   const form = useForm<CheckOutFormValues>({
      resolver: zodResolver(checkOutSchema),
      defaultValues: { badgeNumber: '', notes: '' },
      mode: 'onTouched',
   });

   const badgeNumber = form.watch('badgeNumber');
   const isBadgeComplete = badgeNumber.length === 3;

   // ✦ Live badge lookup — fires only when all 3 digits are entered
   const {
      data: badgeData,
      isLoading: isBadgeLoading,
      isError: isBadgeError,
   } = useActiveBadge(
      isBadgeComplete ? Number(badgeNumber) : undefined,
      isBadgeComplete,
   );

   const commitBadge = (next: string, fieldOnChange: (v: string) => void) => {
      setTypedDigits(next);
      fieldOnChange(next === '' ? '' : next.padStart(3, '0'));
   };

   // Keep local shift-register in sync if the form is reset externally
   useEffect(() => {
      if (badgeNumber === '') setTypedDigits('');
   }, [badgeNumber]);

   // ✦ Checkout mutation
   const { mutateAsync: checkOut, isPending: isSubmitting } =
      useCheckOutVisit();

   async function onSubmit(values: CheckOutFormValues) {
      try {
         // await checkOut(values);
         await checkOut({
            ...values,
            badgeNumber: Number(values.badgeNumber),
         });
         toast.success(t('deskCheckOut.toast.success'));
         handleReset();
      } catch (error) {
         const message =
            (error as import('axios').AxiosError<{ message: string }>)?.response
               ?.data?.message ??
            'Failed to check out visitor. Please try again.';

         toast.error(message);
      }
   }

   const nextStep = async () => {
      const isLastStep = currentStep === STEP_TITLES.length - 1;

      if (isLastStep) {
         form.handleSubmit(onSubmit)();
         return;
      }

      const valid = await form.trigger(STEP_FIELDS[currentStep]);
      // ✦ Also block advance if badge number wasn't found
      if (!valid || isBadgeError || !badgeData) return;

      setDirection(1);
      setCurrentStep((prev) => prev + 1);
   };

   const prevStep = () => {
      if (currentStep > 0) {
         setDirection(-1);
         setCurrentStep((prev) => prev - 1);
      }
   };

   const handleReset = () => {
      form.reset();
      setCurrentStep(0);
   };

   const renderStep = () => {
      switch (currentStep) {
         case 0:
            return (
               <div className="space-y-6 py-4">
                  <Field>
                     <FieldLabel htmlFor="badgeNumber">
                        Badge Number
                        <span className="text-destructive">*</span>
                     </FieldLabel>
                     <Controller
                        name="badgeNumber"
                        control={form.control}
                        render={({ field }) => (
                           <InputOTP
                              maxLength={3}
                              pattern={REGEXP_ONLY_DIGITS}
                              value={field.value ?? ''}
                              onChange={(value) => {
                                 const digits = value
                                    .replace(/\D/g, '')
                                    .slice(-3);
                                 commitBadge(digits, field.onChange);
                              }}
                              onKeyDown={(e) => {
                                 if (/^[0-9]$/.test(e.key)) {
                                    e.preventDefault();
                                    commitBadge(
                                       (typedDigits + e.key).slice(-3),
                                       field.onChange,
                                    );
                                 } else if (e.key === 'Backspace') {
                                    e.preventDefault();
                                    commitBadge(
                                       typedDigits.slice(0, -1),
                                       field.onChange,
                                    );
                                 } else if (e.key === 'Delete') {
                                    e.preventDefault();
                                    commitBadge('', field.onChange);
                                 }
                              }}
                           >
                              <InputOTPGroup>
                                 <InputOTPSlot index={0} />
                                 <InputOTPSlot index={1} />
                                 <InputOTPSlot index={2} />
                              </InputOTPGroup>
                           </InputOTP>
                        )}
                     />
                     <FieldError>
                        {form.formState.errors.badgeNumber?.message}
                     </FieldError>

                     {/* ✦ Show error only after a completed badge lookup fails */}
                     {!isBadgeLoading && isBadgeError && isBadgeComplete && (
                        <Alert variant="destructive">
                           <CircleAlertIcon />
                           <AlertTitle>{t('deskCheckOut.notFound')}</AlertTitle>
                           <AlertDescription>
                              {t('deskCheckOut.notFoundHint')}
                           </AlertDescription>
                        </Alert>
                     )}
                  </Field>
               </div>
            );

         case 1:
            return (
               <div className="space-y-6 py-4">
                  <div className="bg-muted/60 rounded-xl grid gap-4 p-4">
                     {buildSummary(badgeData).map((item) => (
                        <div
                           key={item.label}
                           className="flex items-center justify-between text-sm"
                        >
                           <span className="text-muted-foreground font-medium">
                              {item.label}
                           </span>
                           <span className="text-foreground font-semibold">
                              {item.value}
                           </span>
                        </div>
                     ))}
                  </div>

                  <Field>
                     <FieldLabel htmlFor="notes">{t('common.notes')}</FieldLabel>
                     <Textarea
                        id="notes"
                        placeholder={t('deskCheckOut.notesPlaceholder')}
                        className="min-h-25"
                        aria-invalid={!!form.formState.errors.notes}
                        {...form.register('notes')}
                     />
                     <FieldError>
                        {form.formState.errors.notes?.message}
                     </FieldError>
                  </Field>
               </div>
            );

         default:
            return null;
      }
   };

   const variants = {
      initial: (dir: number) => ({ x: `${110 * dir}%`, opacity: 0 }),
      animate: { x: '0%', opacity: 1 },
      exit: (dir: number) => ({ x: `${-110 * dir}%`, opacity: 0 }),
   };

   return (
      <div>
         <>
            <MotionConfig
               transition={{ duration: 0.5, type: 'spring', bounce: 0 }}
            >
               <div className="flex w-full items-center justify-center bg-muted/10 p-4">
                  <Card className="w-full max-w-2xl shadow-none border overflow-hidden bg-background">
                     <motion.div layout>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 px-6 py-4">
                           <div className="flex flex-col gap-1">
                              <CardTitle className="text-xl">
                                 {STEP_TITLES[currentStep].title}
                              </CardTitle>
                              <CardDescription>
                                 {STEP_TITLES[currentStep].description}
                              </CardDescription>
                           </div>
                           <div className="flex items-center gap-1.5 pt-1">
                              {STEP_TITLES.map((_, index) => (
                                 <div
                                    key={index}
                                    className={cn(
                                       'h-2 rounded-full transition-all duration-300',
                                       currentStep === index
                                          ? 'w-8 bg-primary'
                                          : 'w-2 bg-primary/20',
                                    )}
                                 />
                              ))}
                           </div>
                        </CardHeader>

                        <motion.div
                           animate={{
                              height:
                                 bounds.height > 0 ? bounds.height : 'auto',
                           }}
                           className="relative overflow-hidden"
                           transition={{
                              type: 'spring',
                              bounce: 0,
                              duration: 0.5,
                           }}
                        >
                           <div ref={ref}>
                              <CardContent className="px-6 py-2 relative">
                                 <AnimatePresence
                                    mode="popLayout"
                                    initial={false}
                                    custom={direction}
                                 >
                                    <motion.div
                                       key={currentStep}
                                       variants={variants}
                                       initial="initial"
                                       animate="animate"
                                       exit="exit"
                                       className="w-full"
                                       custom={direction}
                                    >
                                       {renderStep()}
                                    </motion.div>
                                 </AnimatePresence>
                              </CardContent>
                           </div>
                        </motion.div>

                        <CardFooter className="flex justify-between items-center border-t py-4">
                           <Button
                              variant="secondary"
                              type="button"
                              onClick={prevStep}
                              disabled={currentStep === 0 || isSubmitting}
                           >
                              <ChevronLeft className="h-4 w-4" />
                              {t('common.back')}
                           </Button>
                           <Button
                              type="button"
                              onClick={nextStep}
                              disabled={
                                 isSubmitting ||
                                 (currentStep === 0 &&
                                    (!isBadgeComplete ||
                                       isBadgeLoading ||
                                       isBadgeError))
                              }
                           >
                              {currentStep === STEP_TITLES.length - 1 ? (
                                 <>
                                    {isSubmitting
                                       ? 'Checking out…'
                                       : 'Check Out'}
                                    <Check className="h-4 w-4" />
                                 </>
                              ) : (
                                 <>
                                    {isBadgeLoading ? 'Verifying…' : 'Continue'}
                                    <ChevronRight className="h-4 w-4" />
                                 </>
                              )}
                           </Button>
                        </CardFooter>
                     </motion.div>
                  </Card>
               </div>
            </MotionConfig>
         </>
      </div>
   );
};

export default VisitorCheckOutForm;
