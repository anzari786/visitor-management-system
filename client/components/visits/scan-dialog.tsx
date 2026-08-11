'use client';

import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { IdCard, QrCode, ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';

type ScanDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   /** Temporary: open the check-in dialog after choosing Scan Visitor QR. */
   onScanVisitorQr?: () => void;
   /** Temporary: open the check-out dialog after choosing Scan Badge. */
   onScanBadge?: () => void;
};

type ScanOption = {
   id: 'visitor-qr' | 'badge';
   title: string;
   description: string;
   icon: typeof QrCode;
   accent: string;
   iconWrap: string;
};

const SCAN_OPTIONS: ScanOption[] = [
   {
      id: 'visitor-qr',
      title: 'Scan Visitor QR',
      description:
         'Scan the QR code sent to the visitor by email to locate their visit and check them in.',
      icon: QrCode,
      accent: 'hover:border-sky-300 hover:bg-sky-50/60 dark:hover:border-sky-700 dark:hover:bg-sky-950/30',
      iconWrap: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400',
   },
   {
      id: 'badge',
      title: 'Scan Badge',
      description:
         "Scan the visitor's badge to find their active visit and complete check-out.",
      icon: IdCard,
      accent: 'hover:border-emerald-300 hover:bg-emerald-50/60 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30',
      iconWrap:
         'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
   },
];

export function ScanDialog({
   open,
   onOpenChange,
   onScanVisitorQr,
   onScanBadge,
}: ScanDialogProps) {
   const handleSelect = (option: ScanOption) => {
      onOpenChange(false);

      if (option.id === 'visitor-qr') {
         onScanVisitorQr?.();
         return;
      }

      if (option.id === 'badge') {
         onScanBadge?.();
      }
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="gap-5 sm:max-w-md">
            <DialogHeader className="space-y-3">
               <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted/60">
                  <ScanLine className="size-5 text-foreground" />
               </div>
               <div className="space-y-1.5">
                  <DialogTitle className="text-lg">Scan visitor</DialogTitle>
                  <DialogDescription>
                     Choose what you want to scan to process a visitor check-in
                     or check-out.
                  </DialogDescription>
               </div>
            </DialogHeader>

            <div className="grid gap-3">
               {SCAN_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                     <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelect(option)}
                        className={cn(
                           'flex w-full items-start gap-3.5 rounded-xl border border-border bg-card p-4 text-left transition-colors',
                           option.accent,
                        )}
                     >
                        <div
                           className={cn(
                              'flex size-10 shrink-0 items-center justify-center rounded-lg',
                              option.iconWrap,
                           )}
                        >
                           <Icon className="size-5" />
                        </div>
                        <div className="min-w-0 space-y-1">
                           <p className="text-sm font-semibold text-foreground">
                              {option.title}
                           </p>
                           <p className="text-xs leading-relaxed text-muted-foreground">
                              {option.description}
                           </p>
                        </div>
                     </button>
                  );
               })}
            </div>
         </DialogContent>
      </Dialog>
   );
}
