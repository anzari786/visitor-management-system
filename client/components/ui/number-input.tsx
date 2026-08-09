'use client';

import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type NumberInputProps = {
   id?: string;
   value: number;
   onChange: (value: number) => void;
   min?: number;
   max?: number;
   className?: string;
   'aria-invalid'?: boolean;
};

export function NumberInput({
   id,
   value,
   onChange,
   min = 1,
   max = 99,
   className,
   'aria-invalid': ariaInvalid,
}: NumberInputProps) {
   const clamp = (next: number) => Math.min(max, Math.max(min, next));

   return (
      <div className={cn('flex gap-2', className)}>
         <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 cursor-pointer px-2.5"
            onClick={() => onChange(clamp(value - 1))}
            disabled={value <= min}
            aria-label="Decrease"
         >
            <Minus className="size-4" />
         </Button>
         <Input
            id={id}
            type="number"
            min={min}
            max={max}
            className="h-9 bg-background text-center"
            value={value}
            aria-invalid={ariaInvalid}
            onChange={(e) => {
               const next = Number(e.target.value);
               if (Number.isNaN(next)) return;
               onChange(clamp(next));
            }}
         />
         <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 cursor-pointer px-2.5"
            onClick={() => onChange(clamp(value + 1))}
            disabled={value >= max}
            aria-label="Increase"
         >
            <Plus className="size-4" />
         </Button>
      </div>
   );
}
