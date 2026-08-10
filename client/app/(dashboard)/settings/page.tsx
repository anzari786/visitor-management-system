import { Content } from '@/components/shared/content';
import { SettingsTabs } from '@/components/settings/settings-tabs';
import { canAccess } from '@/lib/access';
import { getServerUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
   const user = await getServerUser();

   if (!user || !canAccess(user.role, 'settings')) {
      redirect('/');
   }

   return (
      <Content
         subtitle={
            <p>
               Configure organization-wide visitor settings and preferences.
            </p>
         }
      >
         <SettingsTabs />
      </Content>
   );
}
