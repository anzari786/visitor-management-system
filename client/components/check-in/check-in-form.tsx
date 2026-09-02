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
import { Input } from '@/components/ui/input';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { ID_TYPE_OPTIONS } from '@/constants/visit';
import { useDepartments } from '@/hooks/use-departments';
import { useActiveBadge, useCheckInVisit } from '@/hooks/use-visits';
import { formatEthiopianPhone } from '@/lib/phone';
import { cn } from '@/lib/utils';
import {
   CheckInFormInput,
   checkInSchema,
   type CheckInFormValues,
} from '@/lib/validations/check-in.schema';
import type { CheckInResponse } from '@/types/visit.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import {
   Check,
   ChevronLeft,
   ChevronRight,
   CircleAlertIcon,
   CircleCheckIcon,
   Loader2,
} from 'lucide-react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import useMeasure from 'react-use-measure';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '../reui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { CheckInSuccessDialog } from './check-in-success-dialog';
import { useTranslation, type TranslationKey } from '@/lib/i18n';

const STEP_FIELDS: (keyof CheckInFormValues)[][] = [
   ['fullName', 'phone', 'idType', 'idNumber', 'host', 'departmentId'],
   ['badgeNumber'],
];

const STEP_TITLES = [
   {
      title: 'Visit Registration',
      description: "Enter the visitor's personal and visit details.",
   },
   {
      title: 'Badge Assignment',
      description:
         'Assign a visitor badge and verify all details before completing registration.',
   },
];

export default function VisitorCheckInForm() {
   const { t } = useTranslation();
   const [currentStep, setCurrentStep] = useState(0);
   const [direction, setDirection] = useState<number>();
   const [typedDigits, setTypedDigits] = useState('');
   const [ref, bounds] = useMeasure();
   const [showSuccessDialog, setShowSuccessDialog] = useState(false);
   const [checkInResult, setCheckInResult] = useState<CheckInResponse | null>(
      null,
   );
   const router = useRouter();

   const { data: departments } = useDepartments();
   const { mutateAsync: checkIn, isPending: isSubmitting } = useCheckInVisit();

   const form = useForm<CheckInFormInput, unknown, CheckInFormValues>({
      resolver: zodResolver(checkInSchema),
      defaultValues: {
         fullName: '',
         phone: '+251 ',
         idType: undefined,
         idNumber: '',
         host: '',
         departmentId: undefined,
         badgeNumber: '',
      },
      mode: 'onTouched',
   });

   const badgeNumber = form.watch('badgeNumber');
   const isBadgeComplete = badgeNumber.length === 3;

   const {
      data: activeBadgeData,
      isFetching: checkingBadge,
      isSuccess: badgeChecked,
   } = useActiveBadge(
      isBadgeComplete ? Number(badgeNumber) : undefined,
      currentStep === 1 && isBadgeComplete,
   );

   const commitBadge = (next: string, fieldOnChange: (v: string) => void) => {
      setTypedDigits(next);
      fieldOnChange(next === '' ? '' : next.padStart(3, '0'));
   };

   // Keep local shift-register in sync if the form is reset externally
   useEffect(() => {
      if (badgeNumber === '') setTypedDigits('');
   }, [badgeNumber]);

   const isBadgeUnavailable = badgeChecked && !!activeBadgeData;
   const isBadgeAvailable = badgeChecked && !activeBadgeData;

   async function onSubmit(values: CheckInFormValues) {
      try {
         const data = await checkIn({
            ...values,
            badgeNumber: Number(values.badgeNumber),
         });
         setCheckInResult(data);
         setShowSuccessDialog(true);
         toast.success(t('deskCheckIn.toast.success'));
      } catch (error) {
         const message =
            (error as import('axios').AxiosError<{ message: string }>)?.response
               ?.data?.message ??
            'Failed to check in visitor. Please try again.';
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
      if (!valid) return;

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
      setShowSuccessDialog(false);
      setCheckInResult(null);
      form.reset();
      setCurrentStep(0);
   };

   const content = useMemo(() => {
      switch (currentStep) {
         case 0:
            return (
               <div className="space-y-6 py-4">
                  <Field>
                     <FieldLabel htmlFor="fullName">
                        Full Name <span className="text-destructive">*</span>
                     </FieldLabel>
                     <Input
                        id="fullName"
                        placeholder={t('deskCheckIn.namePlaceholder')}
                        aria-invalid={!!form.formState.errors.fullName}
                        {...form.register('fullName')}
                     />
                     <FieldError>
                        {form.formState.errors.fullName?.message}
                     </FieldError>
                  </Field>

                  <Field>
                     <FieldLabel htmlFor="phone">{t('common.phoneNumber')}</FieldLabel>
                     <Controller
                        name="phone"
                        control={form.control}
                        render={({ field }) => (
                           <Input
                              id="phone"
                              type="tel"
                              placeholder={t('deskCheckIn.phonePlaceholder')}
                              aria-invalid={!!form.formState.errors.phone}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                 field.onChange(
                                    formatEthiopianPhone(e.target.value),
                                 )
                              }
                           />
                        )}
                     />
                     <FieldError>
                        {form.formState.errors.phone?.message}
                     </FieldError>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                     <Field>
                        <FieldLabel htmlFor="idType">
                           ID Type <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Controller
                           name="idType"
                           control={form.control}
                           render={({ field }) => (
                              <Select
                                 value={field.value}
                                 onValueChange={field.onChange}
                              >
                                 <SelectTrigger
                                    id="idType"
                                    className="w-full"
                                    aria-invalid={
                                       !!form.formState.errors.idType
                                    }
                                 >
                                    <SelectValue placeholder={t('checkIn.selectIdType')} />
                                 </SelectTrigger>
                                 <SelectContent>
                                    {ID_TYPE_OPTIONS.map((opt) => (
                                       <SelectItem
                                          key={opt.value}
                                          value={opt.value}
                                       >
                                          {opt.label}
                                       </SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           )}
                        />
                        <FieldError>
                           {form.formState.errors.idType?.message}
                        </FieldError>
                     </Field>

                     <Field>
                        <FieldLabel htmlFor="idNumber">
                           ID Number <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                           id="idNumber"
                           placeholder={t('deskCheckIn.idPlaceholder')}
                           aria-invalid={!!form.formState.errors.idNumber}
                           {...form.register('idNumber')}
                        />
                        <FieldError>
                           {form.formState.errors.idNumber?.message}
                        </FieldError>
                     </Field>
                  </div>

                  <Field>
                     <FieldLabel htmlFor="host">
                        Host <span className="text-destructive">*</span>
                     </FieldLabel>
                     <Input
                        id="host"
                        placeholder={t('deskCheckIn.hostPlaceholder')}
                        aria-invalid={!!form.formState.errors.host}
                        {...form.register('host')}
                     />
                     <FieldError>
                        {form.formState.errors.host?.message}
                     </FieldError>
                  </Field>

                  <Field>
                     <FieldLabel htmlFor="department">{t('common.department')}</FieldLabel>
                     <Controller
                        name="departmentId"
                        control={form.control}
                        render={({ field }) => (
                           <Select
                              value={field.value ? String(field.value) : ''}
                              onValueChange={field.onChange}
                           >
                              <SelectTrigger id="department" className="w-full">
                                 <SelectValue placeholder={t('export.selectDepartment')} />
                              </SelectTrigger>
                              <SelectContent>
                                 {departments
                                    ?.filter((d) => d.isActive)
                                    .map((d) => (
                                       <SelectItem
                                          key={d.id}
                                          value={String(d.id)}
                                       >
                                          {d.name}
                                       </SelectItem>
                                    ))}
                              </SelectContent>
                           </Select>
                        )}
                     />
                     <FieldError>
                        {form.formState.errors.departmentId?.message}
                     </FieldError>
                  </Field>
               </div>
            );

         case 1:
            return (
               <div className="space-y-6 py-4">
                  <Field>
                     <FieldLabel htmlFor="badgeNumber">{t('deskCheckIn.badgeNumber')}</FieldLabel>
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

                     {/* Checking — spinner while the API call is in flight */}
                     {isBadgeComplete && checkingBadge && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                           <Loader2 className="size-4 animate-spin" />
                           {t('deskCheckIn.checkingBadge')}
                        </div>
                     )}

                     {/* Available */}
                     {isBadgeAvailable && !checkingBadge && (
                        <Alert variant="success">
                           <CircleCheckIcon />
                           <AlertTitle>{t('deskCheckIn.badgeAvailable')}</AlertTitle>
                           <AlertDescription>
                              {t('deskCheckIn.badgeAvailableHint')}
                           </AlertDescription>
                        </Alert>
                     )}

                     {/* Unavailable — shows who currently holds the badge */}
                     {isBadgeUnavailable && !checkingBadge && (
                        <Alert variant="destructive">
                           <CircleAlertIcon />
                           <AlertTitle>{t('deskCheckIn.badgeUnavailable')}</AlertTitle>
                           <AlertDescription>
                              Badge {badgeNumber} is currently assigned to{' '}
                              <span className="font-medium">
                                 {activeBadgeData.visitorName}
                              </span>{' '}
                              (checked in at{' '}
                              {new Date(
                                 activeBadgeData.checkInTime,
                              ).toLocaleTimeString([], {
                                 hour: '2-digit',
                                 minute: '2-digit',
                              })}
                              ). Please choose another badge.
                           </AlertDescription>
                        </Alert>
                     )}

                     {/* Prompt — badge not yet complete */}
                     {!isBadgeComplete && (
                        <p className="text-xs text-muted-foreground">
                           {t('deskCheckIn.badgeEnterHint')}
                        </p>
                     )}
                  </Field>
               </div>
            );

         default:
            return null;
      }
   }, [
      currentStep,
      form.control,
      form.formState.errors,
      form.register,
      departments,
      checkingBadge,
      isBadgeComplete,
      isBadgeAvailable,
      isBadgeUnavailable,
      activeBadgeData,
      badgeNumber,
   ]);

   const variants = {
      initial: (dir: number) => ({ x: `${110 * dir}%`, opacity: 0 }),
      animate: { x: '0%', opacity: 1 },
      exit: (dir: number) => ({ x: `${-110 * dir}%`, opacity: 0 }),
   };

   // Disable Check In if badge is unavailable or still being checked
   const isNextDisabled =
      isSubmitting ||
      (currentStep === 1 &&
         (checkingBadge || isBadgeUnavailable || !isBadgeComplete));

   return (
      <div>
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
                           height: bounds.height > 0 ? bounds.height : 'auto',
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
                                    {content}
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
                           disabled={isNextDisabled}
                        >
                           {currentStep === STEP_TITLES.length - 1 ? (
                              <>
                                 {isSubmitting ? 'Checking in…' : 'Check In'}
                                 <Check className="h-4 w-4" />
                              </>
                           ) : (
                              <>
                                 Continue <ChevronRight className="h-4 w-4" />
                              </>
                           )}
                        </Button>
                     </CardFooter>
                  </motion.div>
               </Card>
            </div>
         </MotionConfig>

         <CheckInSuccessDialog
            open={showSuccessDialog}
            onOpenChange={setShowSuccessDialog}
            data={checkInResult}
            onBackToDashboard={() => {
               // setShowSuccessDialog(false);
               router.push('/dashboard');
            }}
            onRegisterAnother={handleReset}
         />
      </div>
   );
}
