/** Allowed profile avatar paths stored under the client `public/` folder. */
export const ALLOWED_PROFILE_AVATARS = [
   '/avatars/profile-user.svg',
   '/avatars/user-1.jpg',
   '/avatars/user-2.jpg',
   '/avatars/user-3.jpg',
   '/avatars/user-4.jpg',
] as const;

export type AllowedProfileAvatar = (typeof ALLOWED_PROFILE_AVATARS)[number];

export function isAllowedProfileAvatar(
   value: string | null | undefined,
): value is AllowedProfileAvatar | null | undefined {
   if (value == null || value === '') return true;
   return (ALLOWED_PROFILE_AVATARS as readonly string[]).includes(value);
}
