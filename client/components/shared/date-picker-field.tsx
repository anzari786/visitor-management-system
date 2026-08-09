'use client';

import { useState } from 'react';
import { format, startOfDay } from 'date-fns';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
   Field,
   FieldError,
   FieldLabel,
} from '@/components/ui/field';
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from '@/components/ui/popover';

type DatePickerFieldProps = {
   id: string;
   label: string;
   value?: Date;
   onChange: (date: Date | undefined) => void;
   placeholder: string;
   error?: string;
   disabledDate?: (date: Date) => boolean;
};

export function DatePickerField({
   id,
   label,
   value,
   onChange,
   placeholder,
   error,
   disabledDate,
}: DatePickerFieldProps) {
   const [open, setOpen] = useState(false);

   return (
      <Field>
         <FieldLabel htmlFor={id}>
            {label} <span className="text-destructive">*</span>
         </FieldLabel>
         <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
               <Button
                  type="button"
                  variant="outline"
                  id={id}
                  className={cn(
                     'h-9 w-full justify-start px-3 font-normal shadow-xs',
                     !value && 'text-muted-foreground',
                  )}
                  aria-invalid={!!error}
               >
                  <CalendarIcon className="size-4 opacity-70" />
                  {value ? format(value, 'PPP') : <span>{placeholder}</span>}
                  <ChevronDown className="ml-auto size-4 opacity-50" />
               </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
               <Calendar
                  mode="single"
                  selected={value}
                  onSelect={(date) => {
                     onChange(date);
                     setOpen(false);
                  }}
                  disabled={
                     disabledDate ??
                     ((date) => date < startOfDay(new Date()))
                  }
               />
            </PopoverContent>
         </Popover>
         <FieldError>{error}</FieldError>
      </Field>
   );
}
