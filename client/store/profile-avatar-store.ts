import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
   DEFAULT_PROFILE_AVATAR_ID,
   getProfileAvatarById,
} from '@/constants/profile-avatars';

type ProfileAvatarState = {
   /** userId → selected avatar option id */
   selections: Record<string, string>;
   setAvatar: (userId: number | string, avatarId: string) => void;
   getAvatarId: (userId: number | string | null | undefined) => string;
   getAvatarSrc: (userId: number | string | null | undefined) => string;
};

export const useProfileAvatarStore = create<ProfileAvatarState>()(
   persist(
      (set, get) => ({
         selections: {},
         setAvatar: (userId, avatarId) =>
            set((state) => ({
               selections: {
                  ...state.selections,
                  [String(userId)]: avatarId,
               },
            })),
         getAvatarId: (userId) => {
            if (userId == null) return DEFAULT_PROFILE_AVATAR_ID;
            return (
               get().selections[String(userId)] ?? DEFAULT_PROFILE_AVATAR_ID
            );
         },
         getAvatarSrc: (userId) =>
            getProfileAvatarById(get().getAvatarId(userId)).image,
      }),
      {
         name: 'vms-profile-avatars',
         storage: createJSONStorage(() => localStorage),
         partialize: (state) => ({ selections: state.selections }),
      },
   ),
);
