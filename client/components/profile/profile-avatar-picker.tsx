'use client';

import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from '@/components/ui/avatar';
import { RoleBadge } from '@/components/users/role-badge';
import {
   PROFILE_AVATARS,
   type ProfileAvatarOption,
} from '@/constants/profile-avatars';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/user.types';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';

type ProfileAvatarPickerProps = {
   value: string;
   onChange: (avatarId: string) => void;
   previewName: string;
   role: UserRole;
};

function AvatarOption({
   option,
   selected,
   onSelect,
}: {
   option: ProfileAvatarOption;
   selected: boolean;
   onSelect: () => void;
}) {
   return (
      <button
         type="button"
         onClick={onSelect}
         aria-label={`Select ${option.name} avatar`}
         aria-pressed={selected}
         className={cn(
            'group relative rounded-full outline-none transition duration-200',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            selected ? 'z-20' : 'hover:z-30',
         )}
      >
         <span
            className={cn(
               'absolute -inset-0.5 rounded-full transition',
               selected
                  ? 'bg-primary/20 ring-2 ring-primary'
                  : 'ring-2 ring-transparent group-hover:ring-border',
            )}
         />
         <Avatar
            className={cn(
               'size-9 ring-2 ring-background transition duration-300 sm:size-10',
               'group-hover:scale-105',
               selected && 'scale-105',
            )}
         >
            <AvatarImage
               src={option.image}
               alt={option.name}
               className="object-cover object-top"
            />
            <AvatarFallback>{option.name.slice(0, 1)}</AvatarFallback>
         </Avatar>
         {selected && (
            <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
               <Check className="size-2.5" strokeWidth={3} />
            </span>
         )}
      </button>
   );
}

export function ProfileAvatarPicker({
   value,
   onChange,
   previewName,
   role,
}: ProfileAvatarPickerProps) {
   const selected = PROFILE_AVATARS.find((avatar) => avatar.id === value);
   const previewSrc = selected?.image ?? PROFILE_AVATARS[0].image;

   return (
      <div className="flex flex-col gap-5">
         <div className="flex flex-col gap-1">
            <h6 className="text-sm font-medium text-primary">Avatar</h6>
            <p className="text-sm font-normal text-muted-foreground">
               Choose a profile photo. Your selection updates instantly.
            </p>
         </div>

         <motion.div
            key={previewSrc}
            initial={{ opacity: 0.6, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="mx-auto"
         >
            <Avatar className="size-30 ring-2 ring-border">
               <AvatarImage
                  src={previewSrc}
                  alt={previewName}
                  className="object-cover object-top"
               />
               <AvatarFallback className="text-2xl">
                  {previewName.slice(0, 1)}
               </AvatarFallback>
            </Avatar>
         </motion.div>

         <div className="flex flex-col items-center gap-1.5 text-center">
            <h5 className="text-base font-medium text-primary">{previewName}</h5>
            <RoleBadge role={role} />
         </div>

         <div className="space-y-2.5">
            <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
               Select avatar
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:-space-x-1 sm:gap-0">
               {PROFILE_AVATARS.map((option) => (
                  <AvatarOption
                     key={option.id}
                     option={option}
                     selected={option.id === value}
                     onSelect={() => onChange(option.id)}
                  />
               ))}
            </div>
         </div>
      </div>
   );
}
