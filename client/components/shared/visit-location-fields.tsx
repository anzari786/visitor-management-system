'use client';

import { useMemo, useState } from 'react';
import {
   Controller,
   type FieldValues,
   type Path,
   type UseFormReturn,
} from 'react-hook-form';
import { FLOOR_OPTIONS, ROOM_OPTIONS } from '@/constants/visit-location';
import {
   Autocomplete,
   AutocompleteContent,
   AutocompleteEmpty,
   AutocompleteInput,
   AutocompleteItem,
   AutocompleteList,
} from '@/components/ui/autocomplete';
import {
   Field,
   FieldDescription,
   FieldError,
   FieldLabel,
} from '@/components/ui/field';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';

type LocationFormFields = {
   floor?: string;
   room?: string;
};

type VisitLocationFieldsProps<T extends FieldValues & LocationFormFields> = {
   form: UseFormReturn<T>;
   idPrefix?: string;
   showDescription?: boolean;
};

function RoomAutocompleteField<T extends FieldValues & LocationFormFields>({
   form,
   roomId,
}: {
   form: UseFormReturn<T>;
   roomId: string;
}) {
   const [open, setOpen] = useState(false);
   const [inputValue, setInputValue] = useState('');
   const roomError = form.formState.errors.room;

   const results = useMemo(() => {
      const query = inputValue.trim().toLowerCase();
      if (!query) return [...ROOM_OPTIONS];
      return ROOM_OPTIONS.filter((room) => room.toLowerCase().includes(query));
   }, [inputValue]);

   return (
      <Controller
         name={'room' as Path<T>}
         control={form.control}
         render={({ field }) => (
            <Field>
               <FieldLabel htmlFor={roomId} className="gap-1">
                  Room <span className="text-destructive">*</span>
               </FieldLabel>
               <Autocomplete
                  open={open}
                  onOpenChange={setOpen}
                  value={field.value || null}
                  onValueChange={(value) => {
                     field.onChange(value ?? '');
                  }}
                  onInputValueChange={setInputValue}
                  defaultInputValue={field.value ?? ''}
               >
                  <AutocompleteInput
                     id={roomId}
                     size="default"
                     placeholder="Search or select a room"
                     autoComplete="off"
                     showTrigger
                     showClear
                     aria-invalid={!!roomError}
                     onFocus={() => setOpen(true)}
                  />
                  <AutocompleteContent>
                     <AutocompleteList>
                        {results.length === 0 ? (
                           <AutocompleteEmpty>
                              No matching rooms found.
                           </AutocompleteEmpty>
                        ) : (
                           results.map((room) => (
                              <AutocompleteItem
                                 key={room}
                                 value={room}
                                 label={room}
                              >
                                 {room}
                              </AutocompleteItem>
                           ))
                        )}
                     </AutocompleteList>
                  </AutocompleteContent>
               </Autocomplete>
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
   const floorId = `${idPrefix}-floor`;
   const roomId = `${idPrefix}-room`;
   const floorError = form.formState.errors.floor;

   return (
      <div className="space-y-4">
         {showDescription && (
            <FieldDescription>
               Visitors will be directed to this floor and room when they
               arrive.
            </FieldDescription>
         )}

         <Controller
            name={'floor' as Path<T>}
            control={form.control}
            render={({ field }) => (
               <Field>
                  <FieldLabel htmlFor={floorId} className="gap-1">
                     Floor <span className="text-destructive">*</span>
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
                        <SelectValue placeholder="Select the floor" />
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

         <RoomAutocompleteField form={form} roomId={roomId} />
      </div>
   );
}
