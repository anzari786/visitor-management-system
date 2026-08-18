import { homePathForRoles } from '@/lib/access';
import { getServerUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
   const user = await getServerUser();

   if (user) {
      if (user.mustChangePassword) {
         redirect('/change-password');
      }

      redirect(homePathForRoles(user.roles));
   }

   redirect('/login');
}
