'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'motion/react';
import {
   Check,
   ChevronLeft,
   Loader2,
   User,
   CalendarDays,
   CheckCircle2,
   Send,
   type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
   emptyVisitorValues,
   visitRequestSchema,
   type VisitRequestFormInput,
   type VisitRequestFormValues,
} from '@/lib/validations/visit-request.schema';
import { submitVisitRequest } from '@/services/visit-request.service';
import { Button } from '@/components/ui/button';
import { VisitRequestSuccessDialog } from './visit-request-success-dialog';
import { VisitorsStep } from './visitors-step';
import { VisitDetailsStep } from './visit-details-step';
import { ReviewSubmitStep } from './review-submit-step';
import { toast } from 'sonner';

interface Step {
   title: string;
   description: string;
   icon: LucideIcon;
}

const steps: Step[] = [
   {
      title: 'Visitors',
      description: 'Who is visiting',
      icon: User,
   },
   {
      title: 'Visit Details',
      description: 'Host and schedule',
      icon: CalendarDays,
   },
   {
      title: 'Review & Submit',
      description: 'Confirm your request',
      icon: CheckCircle2,
   },
];

const VISIT_DETAILS_FIELDS = [
   'hostId',
   'departmentId',
   'purpose',
   'startDate',
   'endDate',
   'startTime',
   'endTime',
] as const;

export default function VisitRequestForm() {
   const [activeStep, setActiveStep] = useState(0);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [successOpen, setSuccessOpen] = useState(false);

   const form = useForm<
      VisitRequestFormInput,
      unknown,
      VisitRequestFormValues
   >({
      resolver: zodResolver(visitRequestSchema),
      defaultValues: {
         visitors: [{ ...emptyVisitorValues }],
         hostId: undefined,
         departmentId: undefined,
         purpose: undefined,
         startDate: undefined,
         endDate: undefined,
         startTime: '',
         endTime: '',
      },
      mode: 'onTouched',
   });

   const handleNext = async () => {
      if (activeStep === 0) {
         const isValid = await form.trigger('visitors');
         if (!isValid) return;
      }

      if (activeStep === 1) {
         const isValid = await form.trigger([...VISIT_DETAILS_FIELDS]);
         if (!isValid) return;
      }

      if (activeStep < steps.length - 1) {
         setActiveStep((prev) => prev + 1);
      }
   };

   const handleBack = () => {
      if (activeStep > 0) {
         setActiveStep((prev) => prev - 1);
      }
   };

   const handleReset = () => {
      form.reset({
         visitors: [{ ...emptyVisitorValues }],
         hostId: undefined,
         departmentId: undefined,
         purpose: undefined,
         startDate: undefined,
         endDate: undefined,
         startTime: '',
         endTime: '',
      });
      setActiveStep(0);
      setSuccessOpen(false);
   };

   const handleSubmitRequest = form.handleSubmit(async (values) => {
      setIsSubmitting(true);
      try {
         await submitVisitRequest(values);
         setSuccessOpen(true);
      } catch (error) {
         const message =
            error instanceof Error
               ? error.message
               : 'Unable to submit your visit request. Please try again.';
         toast.error(message);
      } finally {
         setIsSubmitting(false);
      }
   });

   return (
      <>
         <div className="mx-auto w-full max-w-3xl space-y-8 rounded-xl border border-border bg-background p-6 shadow-xs md:p-8">
            <div className="relative flex w-full items-center justify-between">
               <div
                  className="absolute h-0.5 bg-border"
                  style={{ left: '16.67%', right: '16.67%', top: '18px' }}
               />

               <motion.div
                  className="absolute h-0.5 origin-left bg-primary"
                  style={{ left: '16.67%', right: '16.67%', top: '18px' }}
                  initial={{ scaleX: 0 }}
                  animate={{
                     scaleX: activeStep / (steps.length - 1),
                  }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
               />

               {steps.map((step, idx) => {
                  const isCompleted = idx < activeStep;
                  const isActive = idx === activeStep;
                  return (
                     <div
                        key={step.title}
                        className="group relative flex flex-1 flex-col items-center"
                     >
                        <motion.div
                           className={cn(
                              'relative z-10 flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold shadow-sm transition-colors duration-300',
                              isCompleted || isActive
                                 ? 'rounded-full bg-primary text-primary-foreground'
                                 : 'bg-muted text-muted-foreground',
                           )}
                           animate={{
                              scale: isActive ? 1.05 : 1,
                           }}
                           transition={{
                              type: 'spring',
                              stiffness: 300,
                              damping: 15,
                           }}
                        >
                           {isCompleted ? (
                              <Check className="h-5 w-5" strokeWidth={2.5} />
                           ) : (
                              <step.icon className="h-5 w-5" />
                           )}
                        </motion.div>

                        <div className="mt-3 space-y-1 px-2 text-center select-none">
                           <p
                              className={cn(
                                 'text-sm font-medium transition-colors duration-300',
                                 isActive || isCompleted
                                    ? 'font-semibold text-foreground'
                                    : 'text-muted-foreground',
                              )}
                           >
                              {step.title}
                           </p>
                           <p
                              className={cn(
                                 'hidden text-xs transition-colors duration-300 sm:block',
                                 isActive || isCompleted
                                    ? 'text-muted-foreground'
                                    : 'text-muted-foreground/50',
                              )}
                           >
                              {step.description}
                           </p>
                        </div>
                     </div>
                  );
               })}
            </div>

            <hr className="border-border/50" />

            <div className="min-h-32">
               <AnimatePresence mode="wait">
                  <motion.div
                     key={activeStep}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.2 }}
                  >
                     {activeStep === 0 && <VisitorsStep form={form} />}
                     {activeStep === 1 && <VisitDetailsStep form={form} />}
                     {activeStep === 2 && (
                        <ReviewSubmitStep
                           form={form}
                           onEditStep={setActiveStep}
                        />
                     )}
                  </motion.div>
               </AnimatePresence>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
               <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={activeStep === 0 || isSubmitting}
                  className={cn(
                     'cursor-pointer gap-1.5',
                     'disabled:pointer-events-none disabled:opacity-50',
                  )}
               >
                  <ChevronLeft className="size-4" />
                  Back
               </Button>

               <div className="flex items-center gap-2">
                  {activeStep === steps.length - 1 ? (
                     <Button
                        type="button"
                        onClick={handleSubmitRequest}
                        disabled={isSubmitting}
                        className="w-full cursor-pointer gap-2 hover:bg-primary/90 sm:w-auto"
                     >
                        {isSubmitting ? (
                           <>
                              <Loader2 className="size-4 animate-spin" />
                              Submitting...
                           </>
                        ) : (
                           <>
                              <Send className="size-4" />
                              Submit Visit Request
                           </>
                        )}
                     </Button>
                  ) : (
                     <Button
                        type="button"
                        onClick={handleNext}
                        className="w-full cursor-pointer hover:bg-primary/90 sm:w-auto"
                     >
                        Continue
                     </Button>
                  )}
               </div>
            </div>
         </div>

         <VisitRequestSuccessDialog
            open={successOpen}
            onOpenChange={(open) => {
               setSuccessOpen(open);
               if (!open) handleReset();
            }}
            onDone={handleReset}
         />
      </>
   );
}
