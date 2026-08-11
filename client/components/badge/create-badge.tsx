'use client';

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
import { QrScannerDialog } from '@/components/shared/qr-scanner-dialog';
import {
   createBadgeSchema,
   type CreateBadgeFormValues,
} from '@/lib/validations/badge.schema';
import { badgesService } from '@/services/badges.service';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, ScanLine } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';

type CreateBadgeProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSubmit?: (values: CreateBadgeFormValues) => void | Promise<void>;
};

const CreateBadge = ({ open, onOpenChange, onSubmit }: CreateBadgeProps) => {
   const [scannerOpen, setScannerOpen] = React.useState(false);
   const [scanSuccess, setScanSuccess] = React.useState(false);

   const {
      register,
      handleSubmit,
      reset,
      setValue,
      setError,
      clearErrors,
      watch,
      formState: { errors, isSubmitting },
   } = useForm<CreateBadgeFormValues>({
      resolver: zodResolver(createBadgeSchema),
      defaultValues: {
         badgeNumber: '',
         qrToken: '',
      },
   });

   const qrToken = watch('qrToken');

   React.useEffect(() => {
      if (open) {
         reset({
            badgeNumber: badgesService.suggestNextNumber(),
            qrToken: '',
         });
         setScanSuccess(false);
         setScannerOpen(false);
      } else {
         setScannerOpen(false);
         setScanSuccess(false);
      }
   }, [open, reset]);

   const handleQrScanned = React.useCallback(
      async (decodedText: string) => {
         const value = decodedText.trim();
         if (!value) {
            throw new Error('Empty QR code. Try scanning again.');
         }

         setValue('qrToken', value, {
            shouldDirty: true,
            shouldValidate: true,
         });
         clearErrors('qrToken');
         setScanSuccess(true);
      },
      [clearErrors, setValue],
   );

   const handleFormSubmit = handleSubmit(async (values) => {
      try {
         await onSubmit?.(values);
      } catch (error) {
         const message =
            (error as { response?: { data?: { message?: string } }; message?: string })
               ?.response?.data?.message ??
            (error as { message?: string })?.message ??
            'Failed to create badge';

         if (/qr/i.test(message)) {
            setError('qrToken', { message });
         } else if (/number/i.test(message)) {
            setError('badgeNumber', { message });
         } else {
            setError('badgeNumber', { message });
         }
         throw error;
      }
   });

   return (
      <>
         <Dialog
            open={open}
            onOpenChange={(next) => {
               if (!next) setScannerOpen(false);
               onOpenChange(next);
            }}
         >
            <DialogContent className="sm:max-w-md">
               <DialogHeader>
                  <DialogTitle>Create Badge</DialogTitle>
                  <DialogDescription>
                     Enter the printed badge number and scan the physical badge
                     QR code. Both are required and must be unique.
                  </DialogDescription>
               </DialogHeader>

               <form onSubmit={handleFormSubmit} className="space-y-4 pt-1">
                  <FieldGroup>
                     <Field>
                        <FieldLabel htmlFor="badgeNumber">
                           Badge Number
                           <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                           id="badgeNumber"
                           placeholder="B-1039"
                           autoComplete="off"
                           aria-invalid={!!errors.badgeNumber}
                           disabled={isSubmitting}
                           {...register('badgeNumber')}
                        />
                        <FieldDescription>
                           Printed number on the physical badge. Enter manually.
                        </FieldDescription>
                        {errors.badgeNumber && (
                           <FieldError>{errors.badgeNumber.message}</FieldError>
                        )}
                     </Field>
                  </FieldGroup>

                  <div className="space-y-2">
                     <p className="text-sm font-medium leading-none">
                        Badge QR Code
                        <span className="text-destructive">*</span>
                     </p>

                     {scanSuccess && qrToken ? (
                        <div
                           className={cn(
                              'flex items-start gap-2.5 rounded-lg border border-emerald-500/30',
                              'bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-800',
                              'dark:text-emerald-300',
                           )}
                        >
                           <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                           <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="font-medium">QR code scanned</p>
                              <p className="truncate font-mono text-xs opacity-90">
                                 {qrToken}
                              </p>
                           </div>
                        </div>
                     ) : (
                        <p className="text-xs text-muted-foreground">
                           Scan the physical badge to capture its QR value.
                        </p>
                     )}

                     {errors.qrToken && (
                        <FieldError>{errors.qrToken.message}</FieldError>
                     )}

                     <Button
                        type="button"
                        variant="outline"
                        className="w-full cursor-pointer"
                        onClick={() => setScannerOpen(true)}
                        disabled={isSubmitting}
                     >
                        <ScanLine className="size-4" />
                        {qrToken ? 'Rescan QR Code' : 'Scan Badge QR'}
                     </Button>
                  </div>

                  <DialogFooter>
                     <DialogClose asChild>
                        <Button
                           type="button"
                           variant="outline"
                           disabled={isSubmitting}
                        >
                           Cancel
                        </Button>
                     </DialogClose>
                     <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating…' : 'Create Badge'}
                     </Button>
                  </DialogFooter>
               </form>
            </DialogContent>
         </Dialog>

         <QrScannerDialog
            open={scannerOpen}
            onOpenChange={setScannerOpen}
            title="Scan Badge QR"
            description="Point the camera at the physical badge QR code. The scanned value is stored for assignment and check-out."
            onScan={handleQrScanned}
         />
      </>
   );
};

export default CreateBadge;
