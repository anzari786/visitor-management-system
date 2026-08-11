'use client';

import { Content } from '@/components/shared/content';
import { useCreateUser, useUsersCount } from '@/hooks/use-users';
import type { CreateUserFormValues } from '@/lib/validations/user.schema';
import { Plus } from 'lucide-react';
import * as React from 'react';
import { Suspense } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import CreateUser from './create-user';
import { UsersTable } from './users-table';
import { UsersTableSkeleton } from './users-table-skeleton';

export function UsersContent() {
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
      <Content
         subtitle={
            <p>
               Manage staff accounts, roles, and access across the visitor
               management system.{' '}
               <span className="text-foreground font-medium tabular-nums">
                  {usersCount} users
               </span>{' '}
               in the system
            </p>
         }
         actionButton={
            <Button
               size="sm"
               onClick={() => setOpen(true)}
               className="gap-2 sm:gap-3 h-8 sm:h-9 text-xs sm:text-sm bg-linear-to-b from-foreground to-foreground/90 text-background"
            >
               <Plus className="size-3 sm:size-4" />
               <span className="hidden sm:inline">Create User</span>
               <span className="sm:hidden">New</span>
            </Button>
         }
      >
         <Suspense fallback={<UsersTableSkeleton rows={10} />}>
            <UsersTable />
         </Suspense>
         <CreateUser
            open={open}
            onOpenChange={setOpen}
            onSubmit={handleCreateUser}
         />
      </Content>
   );
}
