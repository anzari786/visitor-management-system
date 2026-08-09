import { z } from 'zod';
import {
   FLOOR_OPTIONS,
   type FloorOption,
} from '@/constants/visit-location';

const floorValues = FLOOR_OPTIONS as unknown as [
   FloorOption,
   ...FloorOption[],
];

export const visitLocationSchema = z.object({
   floor: z.enum(floorValues, {
      message: 'Please select a floor',
   }),
   room: z
      .string()
      .trim()
      .min(1, 'Room is required')
      .max(100, 'Room must be 100 characters or fewer'),
});

export type VisitLocationInput = z.input<typeof visitLocationSchema>;
export type VisitLocationValues = z.output<typeof visitLocationSchema>;

export const emptyVisitLocationValues: VisitLocationInput = {
   floor: undefined as unknown as FloorOption,
   room: '',
};
