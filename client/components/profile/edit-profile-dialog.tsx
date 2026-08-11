'use client';

import { ChangePasswordDialog } from '@/components/profile/change-password-dialog';
import { ProfileAvatarPicker } from '@/components/profile/profile-avatar-picker';
import { getUserFullName } from '@/components/users/user-card-menu';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogClose,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DEFAULT_PROFILE_AVATAR_ID } from '@/constants/profile-avatars';
import { useCheckUsername, useUpdateProfile } from '@/hooks/use-auth';
import { useDebounce } from '@/hooks/use-debounce';
import { formatEthiopianPhone } from '@/lib/phone';
import {
   profileSchema,
   splitFullName,
   type ProfileFormValues,
} from '@/lib/validations/profile.schema';
import { useAuthStore } from '@/store/auth-store';
import { useProfileAvatarStore } from '@/store/profile-avatar-store';
import { useProfileDialogStore } from '@/store/profile-dialog-store';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CheckIcon, KeyRound, Loader2, XIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export function EditProfileDialog() {
   const open = useProfileDialogStore((s) => s.open);
   const setOpen = useProfileDialogStore((s) => s.setOpen);
   const user = useAuthStore((s) => s.user);
   const getAvatarId = useProfileAvatarStore((s) => s.getAvatarId);
   const setAvatar = useProfileAvatarStore((s) => s.setAvatar);
   const { mutateAsync: updateProfile } = useUpdateProfile();
   const { theme, setTheme, resolvedTheme } = useTheme();
   const [passwordOpen, setPasswordOpen] = React.useState(false);
   const [themeMounted, setThemeMounted] = React.useState(false);
   const [selectedAvatarId, setSelectedAvatarId] = React.useState(
      DEFAULT_PROFILE_AVATAR_ID,
   );
   const [initialAvatarId, setInitialAvatarId] = React.useState(
      DEFAULT_PROFILE_AVATAR_ID,
   );

   React.useEffect(() => setThemeMounted(true), []);

   const {
      register,
      handleSubmit,
      setValue,
      watch,
      reset,
      formState: { errors, isSubmitting, isDirty, dirtyFields },
   } = useForm<ProfileFormValues>({
      resolver: zodResolver(profileSchema),
      defaultValues: {
         fullName: '',
         username: '',
         phone: '+251 ',
      },
   });

   React.useEffect(() => {
      if (open && user) {
         const avatarId = getAvatarId(user.id);
         setSelectedAvatarId(avatarId);
         setInitialAvatarId(avatarId);
         reset({
            fullName: getUserFullName(user),
            username: user.username,
            phone: user.phone ?? '+251 ',
         });
      }
   }, [open, user, reset, getAvatarId]);

   const usernameValue = watch('username');
   const phoneValue = watch('phone');
   const fullNameValue = watch('fullName');

   const isUsernameDirty = !!dirtyFields.username;
   const isAvatarDirty = selectedAvatarId !== initialAvatarId;
   const debouncedUsername = useDebounce(usernameValue, 500);
   const { data: usernameCheck, isFetching: checkingUsername } =
      useCheckUsername(debouncedUsername, open && isUsernameDirty);

   const usernameTaken =
      isUsernameDirty &&
      !checkingUsername &&
      usernameCheck?.available === false;

   const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue('phone', formatEthiopianPhone(e.target.value), {
         shouldDirty: true,
         shouldValidate: true,
      });
   };

   const darkModeEnabled =
      themeMounted && (theme === 'dark' || resolvedTheme === 'dark');

   const previewName =
      fullNameValue?.trim() || (user ? getUserFullName(user) : 'User');

   if (!user) return null;

   const onSubmit = handleSubmit(async (values) => {
      if (usernameTaken) return;

      const { firstName, lastName } = splitFullName(values.fullName);

      try {
         if (isDirty) {
            await updateProfile({
               firstName,
               lastName,
               username: values.username,
               phone:
                  !values.phone || values.phone === '+251 '
                     ? undefined
                     : values.phone,
            });
         }

         if (isAvatarDirty) {
            setAvatar(user.id, selectedAvatarId);
            setInitialAvatarId(selectedAvatarId);
         }

         toast.success('Profile updated successfully');
         reset(values);
         setOpen(false);
      } catch {
         toast.error('Failed to update profile. Please try again.');
      }
   });

   return (
      <>
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
               showCloseButton={false}
               className="gap-0 overflow-hidden p-0 sm:max-w-4xl"
            >
               <DialogHeader className="border-b px-5 py-4 sm:px-6">
                  <DialogTitle className="text-base font-medium">
                     Edit your profile
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                     Update your name, username, phone, and appearance
                     preferences.
                  </DialogDescription>
               </DialogHeader>

               <form onSubmit={onSubmit}>
                  <div className="flex min-h-[22rem] flex-col gap-6 px-5 py-7 sm:min-h-[26rem] sm:flex-row sm:px-6 sm:py-8">
                     <div className="order-last w-full max-w-md border-border sm:order-first sm:border-e md:pe-10">
                        <FieldGroup className="gap-4">
                           <Field className="gap-1.5">
                              <FieldLabel
                                 htmlFor="pf-full-name"
                                 className="text-sm font-normal text-muted-foreground"
                              >
                                 Full Name
                              </FieldLabel>
                              <Input
                                 id="pf-full-name"
                                 className="h-9 text-sm font-normal shadow-xs dark:bg-background"
                                 placeholder="First and last name"
                                 aria-invalid={!!errors.fullName}
                                 {...register('fullName')}
                              />
                              {errors.fullName && (
                                 <FieldError>
                                    {errors.fullName.message}
                                 </FieldError>
                              )}
                           </Field>

                           <Field className="gap-1.5">
                              <FieldLabel
                                 htmlFor="pf-username"
                                 className="text-sm font-normal text-muted-foreground"
                              >
                                 Username
                              </FieldLabel>
                              <div className="relative">
                                 <Input
                                    id="pf-username"
                                    className="h-9 text-sm font-normal shadow-xs dark:bg-background"
                                    aria-invalid={
                                       !!errors.username || usernameTaken
                                    }
                                    {...register('username')}
                                 />
                                 {!errors.username && !isUsernameDirty && (
                                    <CheckIcon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-green-600" />
                                 )}
                                 {isUsernameDirty && checkingUsername && (
                                    <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                                 )}
                                 {isUsernameDirty &&
                                    !checkingUsername &&
                                    usernameCheck?.available && (
                                       <CheckIcon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-green-600" />
                                    )}
                                 {usernameTaken && (
                                    <XIcon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-destructive" />
                                 )}
                              </div>
                              {errors.username && (
                                 <FieldError>
                                    {errors.username.message}
                                 </FieldError>
                              )}
                              {usernameTaken && !errors.username && (
                                 <FieldError>
                                    This username is already taken
                                 </FieldError>
                              )}
                           </Field>

                           <Field className="gap-1.5">
                              <FieldLabel
                                 htmlFor="pf-phone"
                                 className="text-sm font-normal text-muted-foreground"
                              >
                                 Phone
                              </FieldLabel>
                              <Input
                                 id="pf-phone"
                                 type="tel"
                                 placeholder="+251 9XX XXX XXX"
                                 className="h-9 text-sm font-normal shadow-xs dark:bg-background"
                                 aria-invalid={!!errors.phone}
                                 value={phoneValue ?? ''}
                                 onChange={handlePhoneChange}
                              />
                              {errors.phone && (
                                 <FieldError>{errors.phone.message}</FieldError>
                              )}
                           </Field>
                        </FieldGroup>

                        <div className="mt-6 space-y-4">
                           <div className="flex items-center gap-4 sm:gap-6">
                              <div className="flex min-w-0 flex-1 flex-col gap-1">
                                 <Label
                                    htmlFor="pf-dark-mode"
                                    className="text-sm font-medium text-primary"
                                 >
                                    Dark mode
                                 </Label>
                                 <p className="text-sm font-normal text-muted-foreground">
                                    Use a darker interface on this device.
                                 </p>
                              </div>
                              <Switch
                                 id="pf-dark-mode"
                                 checked={darkModeEnabled}
                                 onCheckedChange={(checked) =>
                                    setTheme(checked ? 'dark' : 'light')
                                 }
                              />
                           </div>

                           <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => setPasswordOpen(true)}
                           >
                              <KeyRound className="size-4" />
                              Change password
                           </Button>
                        </div>
                     </div>

                     <div className="flex-1">
                        <ProfileAvatarPicker
                           value={selectedAvatarId}
                           onChange={setSelectedAvatarId}
                           previewName={previewName}
                           role={user.role}
                        />
                     </div>
                  </div>

                  <div className="flex flex-col gap-4 border-t bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                     <p className="text-sm font-normal text-muted-foreground">
                        Joined:{' '}
                        {format(new Date(user.createdAt), 'd MMM, yyyy')}
                     </p>
                     <div className="flex w-full gap-3 sm:w-auto">
                        <DialogClose asChild>
                           <Button
                              type="button"
                              variant="outline"
                              className="h-9 flex-1 rounded-lg shadow-xs sm:flex-none"
                           >
                              Cancel
                           </Button>
                        </DialogClose>
                        <Button
                           type="submit"
                           className="h-9 flex-1 rounded-lg sm:flex-none"
                           disabled={
                              (!isDirty && !isAvatarDirty) ||
                              isSubmitting ||
                              checkingUsername ||
                              usernameTaken
                           }
                        >
                           {isSubmitting ? 'Saving…' : 'Save Changes'}
                        </Button>
                     </div>
                  </div>
               </form>
            </DialogContent>
         </Dialog>

         <ChangePasswordDialog
            open={passwordOpen}
            onOpenChange={setPasswordOpen}
         />
      </>
   );
}
