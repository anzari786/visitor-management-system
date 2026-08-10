'use client';

import { Button } from '@/components/ui/button';
import type { User } from '@/types/user.types';
import { MoreHorizontal } from 'lucide-react';
import { UserActionsMenu } from './user-actions-menu';

interface UserRowActionsProps {
   user: User;
   onViewDetails: (user: User) => void;
}

export function UserRowActions({ user, onViewDetails }: UserRowActionsProps) {
   return (
      <UserActionsMenu
         user={user}
         onViewDetails={onViewDetails}
         align="end"
         trigger={
            <Button variant="ghost" size="icon" className="size-8">
               <span className="sr-only">Open menu</span>
               <MoreHorizontal className="size-4" />
            </Button>
         }
      />
   );
}
