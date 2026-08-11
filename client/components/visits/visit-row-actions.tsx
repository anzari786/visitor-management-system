'use client';

import { Button } from '@/components/ui/button';
import type { ManagedVisit } from '@/types/visit.types';
import { MoreHorizontal } from 'lucide-react';
import { VisitActionsMenu } from './visit-actions-menu';

interface VisitRowActionsProps {
   visit: ManagedVisit;
   onView: (visit: ManagedVisit) => void;
   onCheckIn: (visit: ManagedVisit) => void;
   onCheckOut: (visit: ManagedVisit) => void;
   onCancel: (visit: ManagedVisit) => void;
   onOpenAttendance: (
      visit: ManagedVisit,
      mode: 'check_in' | 'check_out',
   ) => void;
}

export function VisitRowActions({
   visit,
   onView,
   onCheckIn,
   onCheckOut,
   onCancel,
   onOpenAttendance,
}: VisitRowActionsProps) {
   return (
      <VisitActionsMenu
         visit={visit}
         onView={onView}
         onCheckIn={onCheckIn}
         onCheckOut={onCheckOut}
         onCancel={onCancel}
         onOpenAttendance={onOpenAttendance}
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
