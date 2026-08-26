import { UserCheckIcon, UserXIcon } from 'lucide-react';
import { Button } from '../ui/button';
import {
   Dialog,
   DialogClose,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '../ui/dialog';

type ToggleStatusDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   isActive: boolean;
   userName: string;
   onConfirm: () => void;
   isPending?: boolean;
};

export function ToggleStatusDialog({
   open,
   onOpenChange,
   isActive,
   userName,
   onConfirm,
   isPending,
}: ToggleStatusDialogProps) {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            className="data-open:slide-in-from-bottom-8 data-closed:slide-out-to-bottom-8 data-open:zoom-in-100 data-closed:zoom-out-100 duration-300 [[data-slot=dialog-overlay]:has(~_&)]:duration-300 sm:max-w-[400px]"
            showCloseButton={false}
         >
            <div className="flex flex-col items-center text-center gap-4">
               <div
                  className={
                     isActive
                        ? 'flex items-center justify-center size-12 rounded-full bg-destructive/10 text-destructive'
                        : 'flex items-center justify-center size-12 rounded-full bg-green-500/10 text-green-600'
                  }
               >
                  {isActive ? (
                     <UserXIcon size={20} />
                  ) : (
                     <UserCheckIcon size={20} />
                  )}
               </div>
               <DialogHeader className="items-center">
                  <DialogTitle>
                     {isActive ? 'Deactivate User?' : 'Activate User?'}
                  </DialogTitle>
                  <DialogDescription>
                     {isActive
                        ? `${userName}'s account will be deactivated and they will lose access to the system.`
                        : `${userName}'s account will be reactivated and they will regain access to the system.`}
                  </DialogDescription>
               </DialogHeader>
               <div className="flex gap-2 w-full">
                  <DialogClose asChild>
                     <Button
                        variant="outline"
                        disabled={isPending}
                        className="flex-1 cursor-pointer"
                     >
                        Cancel
                     </Button>
                  </DialogClose>
                  <DialogClose asChild>
                     <Button
                        variant={isActive ? 'destructive' : 'default'}
                        onClick={onConfirm}
                        disabled={isPending}
                        className="flex-1 cursor-pointer"
                     >
                        {isPending
                           ? isActive
                              ? 'Deactivating…'
                              : 'Activating…'
                           : isActive
                             ? 'Deactivate User'
                             : 'Activate User'}
                     </Button>
                  </DialogClose>
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
}
