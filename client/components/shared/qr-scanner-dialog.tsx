'use client';

import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CameraOff, Loader2, ScanLine, ShieldAlert } from 'lucide-react';
import { Html5Qrcode, type Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import * as React from 'react';

type QrScannerDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   title?: string;
   description?: string;
   onScan: (decodedText: string) => void | Promise<void>;
};

type ScannerStatus =
   | 'starting'
   | 'scanning'
   | 'processing'
   | 'permission_denied'
   | 'error';

export function QrScannerDialog({
   open,
   onOpenChange,
   title = 'Scan QR code',
   description = 'Position the QR code inside the frame to scan.',
   onScan,
}: QrScannerDialogProps) {
   const scannerId = React.useId().replace(/:/g, '');
   const elementId = `qr-reader-${scannerId}`;
   const scannerRef = React.useRef<Html5Qrcode | null>(null);
   const handledRef = React.useRef(false);
   const [status, setStatus] = React.useState<ScannerStatus>('starting');
   const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
   const [restartToken, setRestartToken] = React.useState(0);

   const stopScanner = React.useCallback(async () => {
      const scanner = scannerRef.current;
      if (!scanner) return;
      try {
         if (scanner.isScanning) {
            await scanner.stop();
         }
         scanner.clear();
      } catch {
         // Camera may already be stopped when the dialog unmounts.
      } finally {
         scannerRef.current = null;
      }
   }, []);

   const closeDialog = React.useCallback(() => {
      void stopScanner();
      onOpenChange(false);
   }, [onOpenChange, stopScanner]);

   React.useEffect(() => {
      if (!open) {
         handledRef.current = false;
         setStatus('starting');
         setErrorMessage(null);
         void stopScanner();
         return;
      }

      let cancelled = false;
      handledRef.current = false;

      const start = async () => {
         setStatus('starting');
         setErrorMessage(null);

         // Wait a tick so the dialog DOM node exists.
         await new Promise((resolve) => setTimeout(resolve, 50));
         if (cancelled) return;

         const element = document.getElementById(elementId);
         if (!element) {
            setStatus('error');
            setErrorMessage('Scanner preview could not be initialized.');
            return;
         }

         try {
            const scanner = new Html5Qrcode(elementId, {
               verbose: false,
            });
            scannerRef.current = scanner;

            const config: Html5QrcodeCameraScanConfig = {
               fps: 10,
               qrbox: (viewfinderWidth, viewfinderHeight) => {
                  const edge = Math.floor(
                     Math.min(viewfinderWidth, viewfinderHeight) * 0.72,
                  );
                  return { width: edge, height: edge };
               },
               aspectRatio: 1,
            };

            const onSuccess = async (decodedText: string) => {
               if (handledRef.current || cancelled) return;
               handledRef.current = true;
               setStatus('processing');
               try {
                  await scanner.stop();
               } catch {
                  // ignore stop races
               }
               try {
                  await onScan(decodedText.trim());
               } catch (error) {
                  handledRef.current = false;
                  setStatus('scanning');
                  setErrorMessage(
                     error instanceof Error
                        ? error.message
                        : 'Invalid QR code. Try again.',
                  );
                  // Restart camera after invalid scan.
                  try {
                     await scanner.start(
                        { facingMode: 'environment' },
                        config,
                        onSuccess,
                        () => undefined,
                     );
                     setStatus('scanning');
                  } catch {
                     setStatus('error');
                  }
                  return;
               }
               onOpenChange(false);
            };

            try {
               await scanner.start(
                  { facingMode: 'environment' },
                  config,
                  onSuccess,
                  () => undefined,
               );
            } catch {
               // Fallback to any available camera (desktop webcams).
               const cameras = await Html5Qrcode.getCameras();
               if (!cameras.length) {
                  throw new Error('No camera found on this device.');
               }
               await scanner.start(
                  cameras[0]!.id,
                  config,
                  onSuccess,
                  () => undefined,
               );
            }

            if (!cancelled) setStatus('scanning');
         } catch (error) {
            if (cancelled) return;
            const message =
               error instanceof Error ? error.message : 'Unable to start camera';
            const denied =
               /NotAllowedError|Permission|denied|NotReadableError/i.test(
                  message,
               );
            setStatus(denied ? 'permission_denied' : 'error');
            setErrorMessage(
               denied
                  ? 'Camera permission was denied. Allow camera access and try again.'
                  : message,
            );
         }
      };

      void start();

      return () => {
         cancelled = true;
         void stopScanner();
      };
   }, [open, elementId, onOpenChange, onScan, stopScanner, restartToken]);

   return (
      <Dialog
         open={open}
         onOpenChange={(next) => {
            if (!next) void stopScanner();
            onOpenChange(next);
         }}
      >
         <DialogContent
            showCloseButton={false}
            className={cn(
               'gap-0 overflow-hidden p-6 duration-300 sm:max-w-md',
               'data-[state=open]:slide-in-from-left-8 data-[state=closed]:slide-out-to-left-8',
               'data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100',
               '[[data-slot=dialog-overlay]:has(~_&)]:duration-300',
            )}
         >
            <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
               <ScanLine size={18} />
            </div>

            <DialogHeader className="gap-1.5 text-left">
               <DialogTitle>{title}</DialogTitle>
               <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex flex-col gap-3">
               <div className="relative overflow-hidden rounded-xl border bg-muted/30">
                  <div
                     id={elementId}
                     className={cn(
                        'min-h-56 w-full overflow-hidden sm:min-h-64 [&_video]:h-full [&_video]:w-full [&_video]:object-cover',
                        (status === 'permission_denied' ||
                           status === 'error') &&
                           'hidden',
                     )}
                  />

                  {(status === 'starting' || status === 'processing') && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80">
                        <Loader2 className="size-6 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                           {status === 'starting'
                              ? 'Starting camera…'
                              : 'Processing scan…'}
                        </p>
                     </div>
                  )}

                  {status === 'scanning' && (
                     <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent px-4 py-3">
                        <p className="flex items-center justify-center gap-2 text-xs font-medium text-foreground">
                           <ScanLine className="size-3.5" />
                           Align the QR code within the frame
                        </p>
                     </div>
                  )}

                  {(status === 'permission_denied' || status === 'error') && (
                     <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 py-10 text-center sm:min-h-64">
                        {status === 'permission_denied' ? (
                           <ShieldAlert className="size-8 text-amber-500" />
                        ) : (
                           <CameraOff className="size-8 text-muted-foreground" />
                        )}
                        <p className="text-sm font-medium text-foreground">
                           {status === 'permission_denied'
                              ? 'Camera access needed'
                              : 'Scanner unavailable'}
                        </p>
                        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                           {errorMessage}
                        </p>
                        <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           className="cursor-pointer"
                           onClick={() => {
                              void stopScanner().then(() => {
                                 setRestartToken((token) => token + 1);
                              });
                           }}
                        >
                           Try again
                        </Button>
                     </div>
                  )}
               </div>

               {errorMessage &&
                  status !== 'permission_denied' &&
                  status !== 'error' && (
                     <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
                        {errorMessage}
                     </div>
                  )}

               <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full cursor-pointer"
                  onClick={closeDialog}
               >
                  Cancel
               </Button>

               <p className="text-center text-xs text-muted-foreground">
                  QR scanning is optional — you can always find a visit manually.
               </p>
            </div>
         </DialogContent>
      </Dialog>
   );
}
