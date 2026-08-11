export type ProfileAvatarOption = {
   id: string;
   name: string;
   designation: string;
   image: string;
};

/** Selectable profile avatars stored in `/public/avatars`. */
export const PROFILE_AVATARS: ProfileAvatarOption[] = [
   {
      id: 'default',
      name: 'Default',
      designation: 'Profile',
      image: '/avatars/profile-user.svg',
   },
   {
      id: 'user-1',
      name: 'Aarav',
      designation: 'Portrait',
      image: '/avatars/user-1.jpg',
   },
   {
      id: 'user-2',
      name: 'Sofia',
      designation: 'Portrait',
      image: '/avatars/user-2.jpg',
   },
   {
      id: 'user-3',
      name: 'Kenji',
      designation: 'Portrait',
      image: '/avatars/user-3.jpg',
   },
   {
      id: 'user-4',
      name: 'Amelia',
      designation: 'Portrait',
      image: '/avatars/user-4.jpg',
   },
];

export const DEFAULT_PROFILE_AVATAR_ID = PROFILE_AVATARS[0].id;

export function getProfileAvatarById(id: string | null | undefined) {
   return (
      PROFILE_AVATARS.find((avatar) => avatar.id === id) ?? PROFILE_AVATARS[0]
   );
}
