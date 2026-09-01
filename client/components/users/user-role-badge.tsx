'use client';

import { Badge } from '@/components/ui/badge';
import type { UserRole } from '@/types/user.types';
import { USER_ROLE_KEYS, useTranslation } from '@/lib/i18n';

type UserRoleBadgeProps = {
   role: UserRole;
};

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
   const { t } = useTranslation();

   return (
      <Badge
         variant="secondary"
         className="h-6 gap-1.5 rounded-md px-2 font-medium"
      >
         {t(USER_ROLE_KEYS[role])}
      </Badge>
   );
}
