'use client';

import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { QrCode, ScanLine } from 'lucide-react';
import { useTranslation, type TranslationKey } from '@/lib/i18n';

type ScanDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   /** Open the badge QR scanner for check-out lookup. */
   onScanBadge?: () => void;
};

type ScanOption = {
   id: 'badge';
   titleKey: TranslationKey;
   descriptionKey: TranslationKey;
   icon: typeof QrCode;
   accent: string;
   iconWrap: string;
};

const SCAN_OPTION: ScanOption = {
   id: 'badge',
   titleKey: 'scan.badge.title',
   descriptionKey: 'scan.badge.description',
   icon: QrCode,
   accent:
      'hover:border-emerald-300 hover:bg-emerald-50/60 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30',
   iconWrap:
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
};

export function ScanDialog({
   open,
   onOpenChange,
   onScanBadge,
}: ScanDialogProps) {
   const { t } = useTranslation();

   const handleScanBadge = () => {
      onOpenChange(false);
      onScanBadge?.();
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            className={cn(
               'gap-5 duration-300 sm:max-w-md',
               'data-[state=open]:slide-in-from-left-8 data-[state=closed]:slide-out-to-left-8',
               'data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100',
               '[[data-slot=dialog-overlay]:has(~_&)]:duration-300',
            )}
         >
            <DialogHeader className="space-y-3">
               <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ScanLine size={18} />
               </div>
               <div className="space-y-1.5">
                  <DialogTitle className="text-lg">
                     {t('scan.badge.title')}
                  </DialogTitle>
                  <DialogDescription>
                     {t('scan.badge.description')}
                  </DialogDescription>
               </div>
            </DialogHeader>

            <div className="grid gap-3">
               <button
                  type="button"
                  onClick={handleScanBadge}
                  className={cn(
                     'flex w-full items-start gap-3.5 rounded-xl border border-border bg-card p-4 text-left transition-colors',
                     SCAN_OPTION.accent,
                  )}
               >
                  <div
                     className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-lg',
                        SCAN_OPTION.iconWrap,
                     )}
                  >
                     <QrCode className="size-5" />
                  </div>
                  <div className="min-w-0 space-y-1">
                     <p className="text-sm font-semibold text-foreground">
                        {t(SCAN_OPTION.titleKey)}
                     </p>
                     <p className="text-xs leading-relaxed text-muted-foreground">
                        {t(SCAN_OPTION.descriptionKey)}
                     </p>
                  </div>
               </button>
            </div>
         </DialogContent>
      </Dialog>
   );
}
