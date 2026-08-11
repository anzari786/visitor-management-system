import { create } from 'zustand';

type ProfileDialogState = {
   open: boolean;
   setOpen: (open: boolean) => void;
};

export const useProfileDialogStore = create<ProfileDialogState>((set) => ({
   open: false,
   setOpen: (open) => set({ open }),
}));
