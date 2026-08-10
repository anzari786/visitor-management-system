'use client';

import { Plus } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Content } from '@/components/shared/content';
import CreateUser from './create-user';
import { UserCardGrid } from './user-card-grid';
import { useCreateUser, useUsers } from '@/hooks/use-users';
import type { CreateUserFormValues } from '@/lib/validations/user.schema';

export function UsersContent() {
   const [open, setOpen] = React.useState(false);
   const { data: users = [] } = useUsers();
   const { mutateAsync: createUser } = useCreateUser();

   async function handleCreateUser(values: CreateUserFormValues) {
      try {
         await createUser(values);
         toast.success('User created successfully');
         setOpen(false);
      } catch (error) {
         const message =
            (error as import('axios').AxiosError<{ message: string }>)?.response
               ?.data?.message ?? 'Failed to create user. Please try again.';

         toast.error(message);
      }
   }

   return (
      <Content
         subtitle={
            <p>
               <span className="text-foreground font-medium">
                  {users.length} users
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
         <UserCardGrid />
         <CreateUser
            open={open}
            onOpenChange={setOpen}
            onSubmit={handleCreateUser}
         />
      </Content>
   );
}
