'use client';

import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogClose,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { Save } from 'lucide-react';

type SaveSettingsDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onConfirm: () => void;
   isPending?: boolean;
};

export function SaveSettingsDialog({
   open,
   onOpenChange,
   onConfirm,
   isPending = false,
}: SaveSettingsDialogProps) {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            showCloseButton={false}
            className="sm:max-w-sm duration-300 data-[state=open]:slide-in-from-top-8 data-[state=closed]:slide-out-to-top-8 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100"
         >
            <div className="flex flex-col items-center gap-4 text-center">
               <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Save size={20} />
               </div>

               <DialogHeader className="items-center sm:text-center">
                  <DialogTitle>Save System Settings?</DialogTitle>
                  <DialogDescription>
                     The updated configuration will be applied across the
                     visitor management system. Some changes may affect active
                     sessions, visit monitoring, and security policies.
                  </DialogDescription>
               </DialogHeader>

               <div className="flex w-full gap-2">
                  <DialogClose asChild>
                     <Button
                        type="button"
                        variant="outline"
                        className="flex-1 cursor-pointer"
                        disabled={isPending}
                     >
                        Review Changes
                     </Button>
                  </DialogClose>
                  <Button
                     type="button"
                     className="flex-1 cursor-pointer hover:bg-primary/80"
                     disabled={isPending}
                     onClick={onConfirm}
                  >
                     {isPending ? 'Saving…' : 'Save Settings'}
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
}
