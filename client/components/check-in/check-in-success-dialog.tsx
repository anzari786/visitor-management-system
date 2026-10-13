import { Button } from '@/components/ui/button';
import {
   AlertDialog,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogMedia,
   AlertDialogTitle,
} from '../ui/alert-dialog';
import { CheckIcon } from 'lucide-react';
import { format } from 'date-fns';
import { CheckInResponse } from '@/types/visit.types';
import { useTranslation, type TranslationKey } from '@/lib/i18n';

type CheckInSuccessDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   data: CheckInResponse | null;
   onBackToDashboard: () => void;
   onRegisterAnother: () => void;
};

function buildSummary(data: CheckInResponse) {
   return [
      { label: 'Badge', value: data.badge },
      { label: 'Host', value: data.host },
      { label: 'Department', value: data.department?.name ?? '-' },
      {
         label: 'Check-In Time',
         value: format(new Date(data.checkInTime), 'PPp'),
      },
   ];
}

export function CheckInSuccessDialog({
   open,
   onOpenChange,
   data,
   onBackToDashboard,
   onRegisterAnother,
}: CheckInSuccessDialogProps) {
   const { t } = useTranslation();
   return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
         <AlertDialogContent className="gap-5 p-6 sm:max-w-sm">
            <div className="mx-auto flex flex-col items-center justify-center gap-1.5">
               <AlertDialogMedia className="bg-success/10 text-success dark:bg-success/20 rounded-full size-10">
                  <CheckIcon className="size-4" />
               </AlertDialogMedia>
               <AlertDialogTitle className="text-center text-lg">
                  {t('deskCheckIn.success.title')}
               </AlertDialogTitle>
               <AlertDialogDescription className="max-w-xs text-center text-sm">
                  {data?.visitorName} has been successfully checked in and
                  assigned a badge.
               </AlertDialogDescription>
            </div>

            {data && (
               <div className="bg-muted/60 rounded-lg grid gap-3 p-3">
                  {buildSummary(data).map((item) => (
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
            )}

            <AlertDialogFooter className="flex flex-col! gap-1.5">
               <Button
                  variant="outline"
                  className="w-full h-8 text-sm"
                  onClick={onBackToDashboard}
               >
                  {t('deskCheckIn.success.backToDashboard')}
               </Button>
               <AlertDialogCancel
                  variant="default"
                  className="w-full h-8 text-sm"
                  onClick={onRegisterAnother}
               >
                  {t('deskCheckIn.success.registerAnother')}
               </AlertDialogCancel>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
