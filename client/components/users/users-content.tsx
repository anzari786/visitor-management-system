'use client';

import { Content } from '@/components/shared/content';
import { useCreateUser, useUsersCount } from '@/hooks/use-users';
import type {
   CreateSsoUserFormValues,
   CreateUserFormValues,
} from '@/lib/validations/user.schema';
import type { CreateUserPayload } from '@/types/user.types';
import { AxiosError } from 'axios';
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

   async function handleCreateUser(
      values: CreateUserFormValues | CreateSsoUserFormValues,
   ) {
      try {
         const payload: CreateUserPayload =
            'employeeId' in values
               ? {
                    authProvider: 'SSO',
                    employeeId: Number(values.employeeId),
                    roles: [values.role],
                 }
               : {
                    authProvider: 'LOCAL',
                    firstName: values.firstName,
                    lastName: values.lastName,
                    email: values.email,
                    username: values.username,
                    roles: [values.role],
                 };

         await createUser(payload);
         toast.success('User created successfully');
         setOpen(false);
      } catch (error) {
         const message =
            error instanceof AxiosError
               ? error.response?.data?.message
               : undefined;
         toast.error(message ?? 'Failed to create user. Please try again.');
      }
   }

   return (
      <Content
         subtitle={
            <p>
               Manage staff accounts, roles, and access.{' '}
               <span className="font-medium tabular-nums text-foreground">
                  {usersCount} users
               </span>{' '}
               currently have access.
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
