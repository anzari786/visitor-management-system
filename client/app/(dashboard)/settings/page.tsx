import { OpenSettingsThenRedirect } from '@/components/settings/settings-dialog';
import { canAccessPath, homePathForRoles } from '@/lib/access';
import { getServerUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
   const user = await getServerUser();

   if (!user || !canAccessPath(user.roles, '/settings')) {
      redirect(homePathForRoles(user?.roles));
   }

   return <OpenSettingsThenRedirect homePath={homePathForRoles(user.roles)} />;
}
