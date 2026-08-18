import { UsersContent } from '@/components/users/users-content';
import { canAccessPath, homePathForRoles } from '@/lib/access';
import { getServerUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function UsersPage() {
   const user = await getServerUser();

   if (!user || !canAccessPath(user.roles, '/users')) {
      redirect(homePathForRoles(user?.roles));
   }

   return <UsersContent />;
}
