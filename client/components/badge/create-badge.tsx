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
import {
   createBadgeSchema,
   type CreateBadgeFormValues,
} from '@/lib/validations/badge.schema';
import { badgesService } from '@/services/badges.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScanLine } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';

type CreateBadgeProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSubmit?: (values: CreateBadgeFormValues) => void | Promise<void>;
};

type BarcodeDetectorLike = {
   detect: (
      source: ImageBitmapSource,
   ) => Promise<Array<{ rawValue?: string }>>;
};

function getBarcodeDetector():
   | (new (options?: { formats?: string[] }) => BarcodeDetectorLike)
   | null {
   if (typeof window === 'undefined') return null;
   return (
      (
         window as Window & {
            BarcodeDetector?: new (options?: {
               formats?: string[];
            }) => BarcodeDetectorLike;
         }
      ).BarcodeDetector ?? null
   );
}

const CreateBadge = ({ open, onOpenChange, onSubmit }: CreateBadgeProps) => {
   const [isScanning, setIsScanning] = React.useState(false);
   const [hasCameraStream, setHasCameraStream] = React.useState(false);
   const [scanError, setScanError] = React.useState<string | null>(null);
   const videoRef = React.useRef<HTMLVideoElement>(null);
   const streamRef = React.useRef<MediaStream | null>(null);
   const rafRef = React.useRef<number | null>(null);

   const {
      register,
      handleSubmit,
      reset,
      setValue,
      formState: { errors, isSubmitting },
   } = useForm<CreateBadgeFormValues>({
      resolver: zodResolver(createBadgeSchema),
      defaultValues: {
         badgeNumber: '',
      },
   });

   const stopScanning = React.useCallback(() => {
      if (rafRef.current != null) {
         cancelAnimationFrame(rafRef.current);
         rafRef.current = null;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
         videoRef.current.srcObject = null;
      }
      setHasCameraStream(false);
      setIsScanning(false);
   }, []);

   const applyScannedValue = React.useCallback(
      (raw: string) => {
         const cleaned = raw.trim().toUpperCase();
         const match = cleaned.match(/[A-Z0-9]+(?:-[A-Z0-9]+)*/);
         if (!match) return;
         setValue('badgeNumber', match[0], {
            shouldDirty: true,
            shouldValidate: true,
         });
         setScanError(null);
         stopScanning();
      },
      [setValue, stopScanning],
   );

   React.useEffect(() => {
      if (open) {
         reset({ badgeNumber: badgesService.suggestNextNumber() });
         setScanError(null);
         stopScanning();
      } else {
         stopScanning();
      }
   }, [open, reset, stopScanning]);

   React.useEffect(() => {
      return () => stopScanning();
   }, [stopScanning]);

   React.useEffect(() => {
      if (!hasCameraStream || !streamRef.current || !videoRef.current) {
         return;
      }

      const video = videoRef.current;
      const stream = streamRef.current;
      const Detector = getBarcodeDetector();
      let cancelled = false;

      const run = async () => {
         video.srcObject = stream;
         try {
            await video.play();
         } catch {
            return;
         }

         if (!Detector || cancelled) return;

         const detector = new Detector({ formats: ['qr_code'] });

         const tick = async () => {
            if (cancelled || !videoRef.current) return;
            if (videoRef.current.readyState < 2) {
               rafRef.current = requestAnimationFrame(tick);
               return;
            }

            try {
               const codes = await detector.detect(videoRef.current);
               const value = codes[0]?.rawValue;
               if (value) {
                  applyScannedValue(value);
                  return;
               }
            } catch {
               // Keep scanning on transient detect errors.
            }

            rafRef.current = requestAnimationFrame(tick);
         };

         rafRef.current = requestAnimationFrame(tick);
      };

      void run();

      return () => {
         cancelled = true;
         if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
         }
      };
   }, [hasCameraStream, applyScannedValue]);

   const startScanning = async () => {
      setScanError(null);

      const Detector = getBarcodeDetector();
      if (!Detector || !navigator.mediaDevices?.getUserMedia) {
         setIsScanning(true);
         requestAnimationFrame(() => {
            document.getElementById('badgeNumber')?.focus();
         });
         return;
      }

      try {
         const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false,
         });
         streamRef.current = stream;
         setIsScanning(true);
         setHasCameraStream(true);
      } catch {
         setIsScanning(true);
         requestAnimationFrame(() => {
            document.getElementById('badgeNumber')?.focus();
         });
         setScanError(
            'Camera unavailable. Use a handheld scanner or type the number.',
         );
      }
   };

   const handleFormSubmit = handleSubmit(async (values) => {
      await onSubmit?.(values);
   });

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle>Create Badge</DialogTitle>
               <DialogDescription>
                  Enter the badge number or scan its QR code.
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
                        aria-invalid={!!errors.badgeNumber}
                        {...register('badgeNumber')}
                     />
                     <FieldDescription>
                        Type the printed number, or scan the badge QR.
                     </FieldDescription>
                     {errors.badgeNumber && (
                        <FieldError>{errors.badgeNumber.message}</FieldError>
                     )}
                  </Field>
               </FieldGroup>

               <div className="space-y-2">
                  {!isScanning ? (
                     <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={startScanning}
                        disabled={isSubmitting}
                     >
                        <ScanLine className="size-4" />
                        Scan QR Code
                     </Button>
                  ) : hasCameraStream ? (
                     <div className="space-y-2">
                        <div className="relative overflow-hidden rounded-lg border bg-muted/40">
                           <video
                              ref={videoRef}
                              muted
                              playsInline
                              className="aspect-video w-full object-cover"
                           />
                        </div>
                        <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           className="w-full"
                           onClick={stopScanning}
                        >
                           Cancel scan
                        </Button>
                     </div>
                  ) : (
                     <div className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2.5">
                        <ScanLine className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1 space-y-1">
                           <p className="text-xs text-muted-foreground">
                              Scan ready — use a handheld scanner or type the
                              badge number above.
                           </p>
                           <button
                              type="button"
                              className="text-xs font-medium text-primary hover:underline"
                              onClick={stopScanning}
                           >
                              Cancel scan
                           </button>
                        </div>
                     </div>
                  )}

                  {scanError && (
                     <p className="text-xs text-muted-foreground">{scanError}</p>
                  )}
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
   );
};

export default CreateBadge;
