import { Badge, type BadgeProps } from '@/components/reui/badge';
import { USER_ROLE_CONFIG, USER_ROLES } from '@/constants/user';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/user.types';

type RoleBadgeProps = {
   role?: UserRole | null;
   size?: BadgeProps['size'];
   className?: string;
   showIcon?: boolean;
};

export function RoleBadge({
   role,
   size = 'sm',
   className,
   showIcon = false,
}: RoleBadgeProps) {
   const safeRole: UserRole =
      role && USER_ROLES.includes(role as UserRole)
         ? (role as UserRole)
         : 'GUARD';
   const config = USER_ROLE_CONFIG[safeRole];
   const Icon = config.icon;

   return (
      <Badge
         variant={config.badgeVariant}
         size={size}
         radius="full"
         className={cn('font-medium tracking-wide', className)}
      >
         {showIcon && <Icon className="size-2.5" />}
         {config.label}
      </Badge>
   );
}
