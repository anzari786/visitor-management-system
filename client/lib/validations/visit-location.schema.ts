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
      message: 'validation.selectFloor',
   }),
   room: z
      .string()
      .trim()
      .min(1, 'validation.roomRequired')
      .max(100, 'validation.roomMax'),
});

export type VisitLocationInput = z.input<typeof visitLocationSchema>;
export type VisitLocationValues = z.output<typeof visitLocationSchema>;

export const emptyVisitLocationValues: VisitLocationInput = {
   floor: undefined as unknown as FloorOption,
   room: '',
};
