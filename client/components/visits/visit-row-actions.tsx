'use client';

import { Button } from '@/components/ui/button';
import type { ManagedVisit } from '@/types/visit.types';
import { MoreHorizontal } from 'lucide-react';
import { VisitActionsMenu } from './visit-actions-menu';

interface VisitRowActionsProps {
   visit: ManagedVisit;
   onView: (visit: ManagedVisit) => void;
   onCheckOut: (visit: ManagedVisit) => void;
   onCancel: (visit: ManagedVisit) => void;
   onOpenAttendance: (visit: ManagedVisit, mode: 'check_out') => void;
}

export function VisitRowActions({
   visit,
   onView,
   onCheckOut,
   onCancel,
   onOpenAttendance,
}: VisitRowActionsProps) {
   return (
      <VisitActionsMenu
         visit={visit}
         onView={onView}
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
