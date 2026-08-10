import { UsersTable } from '@/components/users/users-table';
import { UsersTableSkeleton } from '@/components/users/users-table-skeleton';
import UsersToolbar from '@/components/users/users-toolbar';
import { canAccess } from '@/lib/access';
import { getServerUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function UsersPage() {
   const user = await getServerUser();

   if (!user || !canAccess(user.role, 'users')) {
      redirect('/');
   }

   return (
      <div className="w-full space-y-5 bg-background p-3 sm:space-y-6 sm:p-4 md:p-6">
         <UsersToolbar />
         <Suspense fallback={<UsersTableSkeleton rows={10} />}>
            <UsersTable />
         </Suspense>
      </div>
   );
}
