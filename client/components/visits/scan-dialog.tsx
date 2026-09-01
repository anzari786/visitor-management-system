'use client';

import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { QrCode, ScanLine, Search } from 'lucide-react';
import { useTranslation, type TranslationKey } from '@/lib/i18n';

type ScanDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   /** Open manual find/search for check-in eligible visits. */
   onFindVisit?: () => void;
   /** Open the badge QR scanner for check-out lookup. */
   onScanBadge?: () => void;
};

type ScanOption = {
   id: 'find-visit' | 'badge';
   titleKey: TranslationKey;
   descriptionKey: TranslationKey;
   badgeKey?: TranslationKey;
   icon: typeof QrCode;
   accent: string;
   iconWrap: string;
};

const SCAN_OPTIONS: ScanOption[] = [
   {
      id: 'find-visit',
      titleKey: 'scan.findVisit.title',
      descriptionKey: 'scan.findVisit.description',
      badgeKey: 'scan.findVisit.badge',
      icon: Search,
      accent:
         'hover:border-sky-300 hover:bg-sky-50/60 dark:hover:border-sky-700 dark:hover:bg-sky-950/30',
      iconWrap: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400',
   },
   {
      id: 'badge',
      titleKey: 'scan.badge.title',
      descriptionKey: 'scan.badge.description',
      icon: QrCode,
      accent:
         'hover:border-emerald-300 hover:bg-emerald-50/60 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30',
      iconWrap:
         'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
   },
];

export function ScanDialog({
   open,
   onOpenChange,
   onFindVisit,
   onScanBadge,
}: ScanDialogProps) {
   const { t } = useTranslation();

   const handleSelect = (option: ScanOption) => {
      onOpenChange(false);

      if (option.id === 'find-visit') {
         onFindVisit?.();
         return;
      }

      if (option.id === 'badge') {
         onScanBadge?.();
      }
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
                     {t('scan.title')}
                  </DialogTitle>
                  <DialogDescription>{t('scan.description')}</DialogDescription>
               </div>
            </DialogHeader>

            <div className="space-y-2">
               <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {t('scan.checkInSection')}
               </p>
               <div className="grid gap-3">
                  {SCAN_OPTIONS.filter((option) => option.id !== 'badge').map(
                     (option) => {
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
                              <div className="min-w-0 flex-1 space-y-1">
                                 <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-foreground">
                                       {t(option.titleKey)}
                                    </p>
                                    {option.badgeKey && (
                                       <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                                          {t(option.badgeKey)}
                                       </span>
                                    )}
                                 </div>
                                 <p className="text-xs leading-relaxed text-muted-foreground">
                                    {t(option.descriptionKey)}
                                 </p>
                              </div>
                           </button>
                        );
                     },
                  )}
               </div>
            </div>

            <div className="space-y-2">
               <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {t('scan.checkOutSection')}
               </p>
               <div className="grid gap-3">
                  {SCAN_OPTIONS.filter((option) => option.id === 'badge').map(
                     (option) => {
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
                                    {t(option.titleKey)}
                                 </p>
                                 <p className="text-xs leading-relaxed text-muted-foreground">
                                    {t(option.descriptionKey)}
                                 </p>
                              </div>
                           </button>
                        );
                     },
                  )}
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
}
