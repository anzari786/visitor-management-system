'use client';

import { useCreateUser, useUsersCount } from '@/hooks/use-users';
import type { CreateUserFormValues } from '@/lib/validations/user.schema';
import { Plus } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import CreateUser from './create-user';

export function UsersToolbar() {
   const [open, setOpen] = React.useState(false);
   const usersCount = useUsersCount();
   const { mutateAsync: createUser } = useCreateUser();

   async function handleCreateUser(values: CreateUserFormValues) {
      try {
         const phone =
            !values.phone || values.phone === '+251 '
               ? undefined
               : values.phone;

         await createUser({
            ...values,
            phone,
         });
         toast.success('User created successfully');
         setOpen(false);
      } catch {
         toast.error('Failed to create user. Please try again.');
      }
   }

   return (
      <div className="flex items-start justify-between gap-3">
         <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
               Users
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
               Manage staff accounts, roles, and access across the visitor
               management system.
               <span className="ml-1 tabular-nums text-muted-foreground/80">
                  ({usersCount} users)
               </span>
            </p>
         </div>

         <Button size="sm" onClick={() => setOpen(true)} className="h-9 shrink-0 gap-2">
            <Plus className="size-4" />
            <span className="hidden sm:inline-flex">Create User</span>
         </Button>

         <CreateUser
            open={open}
            onOpenChange={setOpen}
            onSubmit={handleCreateUser}
         />
      </div>
   );
}

export default UsersToolbar;
