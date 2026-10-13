import { z } from 'zod';

export const badgeVerificationSchema = z.object({
   badgeNumber: z
      .string()
      .length(3, 'validation.badgeExactly3')
      .regex(/^\d{3}$/, 'validation.badgeDigitsOnly'),
});

export const checkOutNotesSchema = z.object({
   notes: z
      .string()
      .max(500, 'validation.notesMax')
      .optional(),
});

// Full schema — merge of both steps
export const checkOutSchema = badgeVerificationSchema.extend(
   checkOutNotesSchema.shape,
);

export type BadgeVerificationValues = z.infer<typeof badgeVerificationSchema>;
export type CheckOutNotesValues = z.infer<typeof checkOutNotesSchema>;
export type CheckOutFormValues = z.infer<typeof checkOutSchema>;
