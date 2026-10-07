import { z } from 'zod';
import { services } from '../content/catalog';
import { privacyVersion } from '../privacy';
import { optionalText } from '../validation';
const base = {
  name: z.string().trim().min(2).max(255),
  email: z
    .email()
    .max(255)
    .transform((s) => s.toLowerCase()),
  phone: optionalText(40),
  city: optionalText(),
  message: z.string().trim().min(10).max(5000),
  privacyAccepted: z.literal(true),
  privacyVersion: z.literal(privacyVersion),
  website: z.string().max(0).optional(),
  source: z.string().max(100).default('contact'),
  quizContext: z
    .object({
      goal: z.enum(['training', 'community', 'education', 'behavior']),
      format: z.enum(['online', 'in-person', 'individual']),
      followup: z.enum(['continuous', 'one-off']),
    })
    .nullish()
    .transform((v) => v || null),
};
export const leadSchema = z.object({
  ...base,
  serviceCode: z
    .string()
    .refine((s) => services.some((v) => v.code === s))
    .nullish()
    .transform((v) => v || null),
  editionId: z
    .number()
    .int()
    .positive()
    .nullish()
    .transform((v) => v || null),
});
export const regionSchema = z.object({
  ...base,
  city: z.string().trim().min(2).max(255),
  province: z.string().trim().min(2).max(255),
  suggestedDates: optionalText(),
  interestedCount: z
    .number()
    .int()
    .min(1)
    .max(10000)
    .nullish()
    .transform((v) => v || null),
});
