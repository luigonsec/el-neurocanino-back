import { parsePhoneNumberFromString } from 'libphonenumber-js/min';
import { z } from 'zod';
import { privacyVersion } from '../privacy';
import { optionalText } from '../validation';
export const phone = z
  .string()
  .trim()
  .max(40)
  .regex(/^[+\d\s().-]+$/)
  .transform((value, ctx) => {
    const parsed = parsePhoneNumberFromString(value, 'ES');
    if (!parsed?.isPossible()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Indica un teléfono válido, con prefijo internacional si no es de España.',
      });
      return z.NEVER;
    }
    return parsed.number;
  });
export const identity = {
  submissionKey: z.uuid(),
  name: z.string().trim().min(2).max(120),
  email: z
    .email()
    .max(255)
    .transform((s) => s.toLowerCase()),
  privacyAccepted: z.literal(true),
  privacyVersion: z.literal(privacyVersion),
  // Accept legacy/autofilled honeypot values without rejecting genuine submissions.
  website: z.string().max(255).optional(),
};
const commonAnswers = {
  goal: z.string().trim().min(2).max(350),
  urgency: z.enum(['now', 'next_month', 'exploring']),
  budget: z.enum(['low', 'medium', 'high']),
  travel: z.enum(['yes', 'no']).optional(),
};
const answers = z.discriminatedUnion('profile', [
  z
    .object({
      ...commonAnswers,
      profile: z.literal('personal'),
      problem: z.string().trim().min(2).max(350),
    })
    .strict(),
  z
    .object({
      ...commonAnswers,
      profile: z.literal('professional'),
      experience: z.enum(['experienced', 'starting', 'future']),
    })
    .strict(),
]);
export const applicationSchema = z
  .object({ ...identity, program: z.enum(['online', 'complete']), phone, answers })
  .strict()
  .superRefine((v, ctx) => {
    if (v.program === 'complete' && !v.answers.travel)
      ctx.addIssue({
        code: 'custom',
        path: ['answers', 'travel'],
        message: 'Indica si puedes desplazarte cuatro días.',
      });
    if (v.program === 'online' && v.answers.travel)
      ctx.addIssue({
        code: 'custom',
        path: ['answers', 'travel'],
        message: 'El programa online no requiere desplazamiento.',
      });
  });
export type ApplicationInput = z.infer<typeof applicationSchema>;
export function qualification(
  input: Pick<ApplicationInput, 'program' | 'answers'>,
): 'community' | 'online' | 'complete' {
  if (input.answers.budget === 'low') return 'community';
  return input.program === 'complete' && input.answers.travel === 'yes' ? 'complete' : 'online';
}
export const contactSchema = z
  .object({
    ...identity,
    phone: z.union([phone, z.literal('')]).optional(),
    city: optionalText(),
    message: z.string().trim().min(10).max(5000),
  })
  .strict();
