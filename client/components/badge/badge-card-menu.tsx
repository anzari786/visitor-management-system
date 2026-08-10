'use client';

import { DeactivateBadgeDialog } from '@/components/badge/deactivate-badge-dialog';
import { MarkLostDialog } from '@/components/badge/mark-lost-dialog';
import { ViewBadgeDialog } from '@/components/badge/view-badge-dialog';
import { Button } from '@/components/ui/button';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuGroup,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUpdateBadgeStatus } from '@/hooks/use-badges';
import type { Badge } from '@/types/badge.types';
import { Ban, EllipsisVertical, Eye, TriangleAlert } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

type BadgeCardMenuProps = {
   badge: Badge;
};

export function BadgeCardMenu({ badge }: BadgeCardMenuProps) {
   const [viewOpen, setViewOpen] = React.useState(false);
   const [deactivateOpen, setDeactivateOpen] = React.useState(false);
   const [lostOpen, setLostOpen] = React.useState(false);

   const { mutate: updateStatus, isPending } = useUpdateBadgeStatus();

   const canDeactivate =
      badge.status === 'available' || badge.status === 'assigned';
   const canMarkLost =
      badge.status === 'available' || badge.status === 'assigned';

   const handleDeactivate = (reason: string) => {
      updateStatus(
         { id: badge.id, status: 'inactive', reason: reason || undefined },
         {
            onSuccess: () =>
               toast.success(`${badge.badgeNumber} has been deactivated`),
            onError: (error) =>
               toast.error(
                  (error as { response?: { data?: { message?: string } } })
                     ?.response?.data?.message ??
                     'Failed to deactivate badge. Please try again.',
               ),
            onSettled: () => setDeactivateOpen(false),
         },
      );
   };

   const handleMarkLost = () => {
      updateStatus(
         { id: badge.id, status: 'lost' },
         {
            onSuccess: () =>
               toast.success(`${badge.badgeNumber} marked as lost`),
            onError: (error) =>
               toast.error(
                  (error as { response?: { data?: { message?: string } } })
                     ?.response?.data?.message ??
                     'Failed to update badge. Please try again.',
               ),
            onSettled: () => setLostOpen(false),
         },
      );
   };

   return (
      <>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  aria-label={`Actions for ${badge.badgeNumber}`}
               >
                  <EllipsisVertical className="size-4" />
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
               <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => setViewOpen(true)}>
                     <Eye className="size-4" />
                     View
                  </DropdownMenuItem>
               </DropdownMenuGroup>

               {(canDeactivate || canMarkLost) && <DropdownMenuSeparator />}

               <DropdownMenuGroup>
                  {canMarkLost && (
                     <DropdownMenuItem
                        onSelect={(e) => {
                           e.preventDefault();
                           setLostOpen(true);
                        }}
                     >
                        <TriangleAlert className="size-4" />
                        Mark as Lost
                     </DropdownMenuItem>
                  )}
                  {canDeactivate && (
                     <DropdownMenuItem
                        variant="destructive"
                        onSelect={(e) => {
                           e.preventDefault();
                           setDeactivateOpen(true);
                        }}
                     >
                        <Ban className="size-4" />
                        Deactivate
                     </DropdownMenuItem>
                  )}
               </DropdownMenuGroup>
            </DropdownMenuContent>
         </DropdownMenu>

         <ViewBadgeDialog
            open={viewOpen}
            onOpenChange={setViewOpen}
            badge={badge}
         />

         <MarkLostDialog
            open={lostOpen}
            onOpenChange={setLostOpen}
            badgeNumber={badge.badgeNumber}
            onConfirm={handleMarkLost}
            isPending={isPending}
         />

         <DeactivateBadgeDialog
            open={deactivateOpen}
            onOpenChange={setDeactivateOpen}
            badgeNumber={badge.badgeNumber}
            onConfirm={handleDeactivate}
            isPending={isPending}
         />
      </>
   );
}
