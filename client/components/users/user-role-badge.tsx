'use client';

import { Badge } from '@/components/ui/badge';
import type { UserRole } from '@/types/user.types';
import { roleFilterLabels } from './users-table-filters';

type UserRoleBadgeProps = {
   role: UserRole;
};

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
   return (
      <Badge
         variant="secondary"
         className="h-6 gap-1.5 rounded-md px-2 font-medium"
      >
         {roleFilterLabels[role]}
      </Badge>
   );
}
