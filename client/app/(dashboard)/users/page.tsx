import { UsersContent } from '@/components/users/users-content';
import { canAccess } from '@/lib/access';
import { getServerUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function UsersPage() {
   const user = await getServerUser();

   if (!user || !canAccess(user.role, 'users')) {
      redirect('/');
   }

   return <UsersContent />;
}
