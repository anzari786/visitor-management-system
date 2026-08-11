import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { User } from '@/types/user.types';
import { Phone } from 'lucide-react';
import Image from 'next/image';
import { RoleBadge } from './role-badge';
import { getUserFullName, UserCardMenu } from './user-card-menu';
import { USER_ROLE_CONFIG } from '@/constants/user';
import { format } from 'date-fns';
import { formatLastLogin } from '@/lib/format-last-login';

type UserCardProps = {
   user: User;
};

export function UserCard({ user }: UserCardProps) {
   const role = USER_ROLE_CONFIG[user.role];

   const stats = [
      { label: 'Check-ins', value: user.checkIns ?? 0 },
      { label: 'Check-outs', value: user.checkOuts ?? 0 },
   ];

   return (
      <div className="rounded-xl border bg-card p-4 flex flex-col gap-4 hover:shadow-sm transition-shadow">
         {/* Header */}
         <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
               <div className="relative">
                  <Image
                     src={role.image}
                     alt={role.label}
                     width={44}
                     height={44}
                     className="rounded-full size-11 border-2 border-border"
                  />
               </div>

               <div>
                  <p className="text-sm font-semibold">
                     {getUserFullName(user)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                     {user.username}
                  </p>
               </div>
            </div>

            <UserCardMenu user={user} />
         </div>

         {/* Role & Status */}
         <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
               <RoleBadge role={user.role} />
               <Separator orientation="vertical" />
               <span
                  className={cn(
                     'text-xs font-medium',
                     user.isActive
                        ? 'text-muted-foreground'
                        : 'text-destructive',
                  )}
               >
                  {user.isActive
                     ? `Active ${formatLastLogin(user.lastLoginAt)}`
                     : 'Inactive'}
               </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
               <Phone className="size-2.5" />
               <span>{user.phone ?? '—'}</span>
            </div>
         </div>

         {/* Stats */}
         <div className="grid grid-cols-2 gap-2 text-center">
            {stats.map((stat) => (
               <div key={stat.label} className="rounded-lg bg-muted p-2">
                  <p className="text-base font-semibold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
               </div>
            ))}
         </div>

         {/* Created on */}
         <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Created on</span>
            <span className="text-xs font-medium">
               {format(new Date(user.createdAt), 'MMM d, yyyy')}
            </span>
         </div>
      </div>
   );
}
