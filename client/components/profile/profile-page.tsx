'use client';

import * as React from 'react';
import Image from 'next/image';
import { Phone, Shield, User as UserIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ProfileForm } from './profile-form';
import { ChangePasswordForm } from './change-password-form';
import { PreferencesForm } from './preferences-form';
import { useUpdateProfile, useChangePassword } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth-store';
import { getUserFullName } from '@/lib/user';
import type {
   ProfileFormValues,
   ChangePasswordFormValues,
} from '@/lib/validations/profile.schema';
import type { UserRole } from '@/types/user.types';
import { toast } from 'sonner';
import { Content } from '@/components/shared/content';
import { SectionCard } from '../shared/section-card';

const roleIconMap: Record<UserRole, React.ReactNode> = {
   admin: <Shield className="size-3 text-chart-4" />,
   front_desk: <UserIcon className="size-3 text-chart-2" />,
};

const roleColorMap: Record<UserRole, string> = {
   admin: 'text-chart-4',
   front_desk: 'text-chart-2',
};

const avatarMap: Record<UserRole, string> = {
   admin: '/admin.svg',
   front_desk: '/front_desk.svg',
};

const roleLabelMap: Record<UserRole, string> = {
   admin: 'Administrator',
   front_desk: 'Front Desk',
};

export function ProfilePage() {
   const user = useAuthStore((state) => state.user);
   const { mutateAsync: updateProfile } = useUpdateProfile();
   const { mutateAsync: changePassword } = useChangePassword();

   if (!user) return null;

   async function handleSaveProfile(values: ProfileFormValues) {
      await updateProfile(values, {
         onSuccess: () => toast.success('Profile updated successfully'),
         onError: () =>
            toast.error('Failed to update profile. Please try again.'),
      });
   }

   async function handleChangePassword(values: ChangePasswordFormValues) {
      await changePassword(
         {
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
         },
         {
            onSuccess: () => toast.success('Password changed successfully'),
            onError: () =>
               toast.error('Failed to change password. Please try again.'),
         },
      );
   }

   return (
      <Content
         subtitle={
            <p>Manage your account details, preferences, and password.</p>
         }
      >
         {/* Identity strip */}
         <div className="flex items-center gap-4 rounded-xl border bg-card p-5 max-w-2xl">
            <Image
               src={avatarMap[user.role]}
               alt="Profile picture"
               width={56}
               height={56}
               className="rounded-full size-14 border-2 border-border"
            />
            <div className="flex-1 min-w-0">
               <p className="text-base font-semibold truncate">
                  {getUserFullName(user)}
               </p>
               <p className="text-sm text-muted-foreground truncate">
                  {user.username}
               </p>
               <div className="flex items-center gap-3 mt-1.5">
                  <div
                     className={cn(
                        'flex items-center gap-1',
                        roleColorMap[user.role],
                     )}
                  >
                     {roleIconMap[user.role]}
                     <span className="text-xs font-medium">
                        {roleLabelMap[user.role]}
                     </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                     <Phone className="size-3" />
                     <span>{user.phone ?? '—'}</span>
                  </div>
               </div>
            </div>
         </div>

         <Tabs defaultValue="profile">
            <TabsList>
               <TabsTrigger value="profile">Profile</TabsTrigger>
               <TabsTrigger value="preferences">Preferences</TabsTrigger>
               <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
               <SectionCard
                  title="Profile"
                  description="Update your username and phone number."
               >
                  <ProfileForm
                     defaultValues={{
                        username: user.username,
                        phone: user.phone ?? '+251 ',
                     }}
                     onSubmit={handleSaveProfile}
                  />
               </SectionCard>
            </TabsContent>

            <TabsContent value="preferences">
               <SectionCard
                  title="Preferences"
                  description="Pick a theme. Your choice is remembered on this device."
               >
                  <PreferencesForm />
               </SectionCard>
            </TabsContent>

            <TabsContent value="password">
               <SectionCard
                  title="Password"
                  description="Use at least 8 characters. Mix letters, numbers, and a symbol for a stronger password."
               >
                  <ChangePasswordForm onSubmit={handleChangePassword} />
               </SectionCard>
            </TabsContent>
         </Tabs>
      </Content>
   );
}

export default ProfilePage;
