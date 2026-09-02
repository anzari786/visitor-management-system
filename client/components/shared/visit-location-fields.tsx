'use client';

import {
   Controller,
   type FieldValues,
   type Path,
   type UseFormReturn,
} from 'react-hook-form';
import { FLOOR_OPTIONS, ROOM_OPTIONS } from '@/constants/visit-location';
import {
   Field,
   FieldDescription,
   FieldError,
   FieldLabel,
} from '@/components/ui/field';
import {
   Select,
   SelectContent,
   SelectGroup,
   SelectItem,
   SelectLabel,
   SelectSeparator,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { useTranslation } from '@/lib/i18n';

type LocationFormFields = {
   floor?: string;
   room?: string;
};

type VisitLocationFieldsProps<T extends FieldValues & LocationFormFields> = {
   form: UseFormReturn<T>;
   idPrefix?: string;
   showDescription?: boolean;
};

const ROOM_GROUPS = FLOOR_OPTIONS.map((floor, floorIndex) => ({
   floor,
   rooms: ROOM_OPTIONS.slice(floorIndex * 2, floorIndex * 2 + 2),
})).filter(({ rooms }) => rooms.length > 0);

function RoomSelectField<T extends FieldValues & LocationFormFields>({
   form,
   roomId,
}: {
   form: UseFormReturn<T>;
   roomId: string;
}) {
   const { t } = useTranslation();
   const roomError = form.formState.errors.room;

   return (
      <Controller
         name={'room' as Path<T>}
         control={form.control}
         render={({ field }) => (
            <Field>
               <FieldLabel htmlFor={roomId} className="gap-1">
                  {t('location.room')}{' '}
                  <span className="text-destructive">*</span>
               </FieldLabel>
               <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
               >
                  <SelectTrigger
                     id={roomId}
                     className="w-full"
                     aria-invalid={!!roomError}
                  >
                     <SelectValue placeholder={t('location.selectRoom')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                     <ScrollArea className="h-72 w-full">
                        {ROOM_GROUPS.map(({ floor, rooms }, floorIndex) => {
                           return (
                              <SelectGroup key={floor}>
                                 <SelectLabel>{floor}</SelectLabel>
                                 {rooms.map((room) => (
                                    <SelectItem key={room} value={room}>
                                       {room}
                                    </SelectItem>
                                 ))}
                                 {floorIndex < ROOM_GROUPS.length - 1 && (
                                    <SelectSeparator />
                                 )}
                              </SelectGroup>
                           );
                        })}
                     </ScrollArea>
                  </SelectContent>
               </Select>
               <FieldError>
                  {typeof roomError?.message === 'string'
                     ? roomError.message
                     : undefined}
               </FieldError>
            </Field>
         )}
      />
   );
}

export function VisitLocationFields<
   T extends FieldValues & LocationFormFields,
>({
   form,
   idPrefix = 'location',
   showDescription = true,
}: VisitLocationFieldsProps<T>) {
   const { t } = useTranslation();
   const floorId = `${idPrefix}-floor`;
   const roomId = `${idPrefix}-room`;
   const floorError = form.formState.errors.floor;

   return (
      <div className="space-y-4">
         {showDescription && (
            <FieldDescription>{t('location.hint')}</FieldDescription>
         )}

         <Controller
            name={'floor' as Path<T>}
            control={form.control}
            render={({ field }) => (
               <Field>
                  <FieldLabel htmlFor={floorId} className="gap-1">
                     {t('location.floor')}{' '}
                     <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                     value={field.value || undefined}
                     onValueChange={field.onChange}
                  >
                     <SelectTrigger
                        id={floorId}
                        className="w-full"
                        aria-invalid={!!floorError}
                     >
                        <SelectValue placeholder={t('location.selectFloor')} />
                     </SelectTrigger>
                     <SelectContent>
                        {FLOOR_OPTIONS.map((floor) => (
                           <SelectItem key={floor} value={floor}>
                              {floor}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
                  <FieldError>
                     {typeof floorError?.message === 'string'
                        ? floorError.message
                        : undefined}
                  </FieldError>
               </Field>
            )}
         />

         <RoomSelectField form={form} roomId={roomId} />
      </div>
   );
}
