'use client';

import { useTranslation } from '@/lib/i18n';
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ToggleDepartmentDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   isActive: boolean;
   departmentName: string;
   onConfirm: () => void;
   isPending?: boolean;
};

export function ToggleDepartmentDialog({
   open,
   onOpenChange,
   isActive,
   departmentName,
   onConfirm,
   isPending,
}: ToggleDepartmentDialogProps) {
   const { t } = useTranslation();

   return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>
                  {t(
                     isActive
                        ? 'departments.toggle.disableTitle'
                        : 'departments.toggle.enableTitle',
                  )}
               </AlertDialogTitle>
               <AlertDialogDescription>
                  {t(
                     isActive
                        ? 'departments.toggle.disableBody'
                        : 'departments.toggle.enableBody',
                     { name: departmentName },
                  )}
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel disabled={isPending}>
                  {t('common.cancel')}
               </AlertDialogCancel>
               <AlertDialogAction
                  variant={isActive ? 'destructive' : 'default'}
                  onClick={onConfirm}
                  disabled={isPending}
               >
                  {isPending
                     ? t(
                          isActive
                             ? 'departments.toggle.disabling'
                             : 'departments.toggle.enabling',
                       )
                     : t(
                          isActive
                             ? 'departments.toggle.disable'
                             : 'departments.toggle.enable',
                       )}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
