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
import { useTranslation } from '@/lib/i18n';

export function UsersContent() {
   const { t } = useTranslation();
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
         toast.success(t('users.toast.created'));
         setOpen(false);
      } catch (error) {
         const message =
            error instanceof AxiosError
               ? error.response?.data?.message
               : undefined;
         toast.error(message ?? t('users.toast.createFailed'));
      }
   }

   return (
      <Content
         subtitle={
            <p>
               {t('users.subtitle')}{' '}
               <span className="font-medium tabular-nums text-foreground">
                  {t('users.accessCount', { count: usersCount })}
               </span>
            </p>
         }
         actionButton={
            <Button
               size="sm"
               onClick={() => setOpen(true)}
               className="gap-2 sm:gap-3 h-8 sm:h-9 text-xs sm:text-sm bg-linear-to-b from-primary to-primary/90 text-background cursor-pointer"
            >
               <Plus className="size-3 sm:size-4" />
               <span className="hidden sm:inline">{t('users.create')}</span>
               <span className="sm:hidden">{t('users.new')}</span>
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
