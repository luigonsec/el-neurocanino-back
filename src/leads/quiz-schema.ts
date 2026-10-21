import {
  getCountries,
  parsePhoneNumberFromString,
  getCountryCallingCode,
} from 'libphonenumber-js/min';
import { z } from 'zod';
import { privacyVersion } from '../privacy';
const code = z.enum([
  'online',
  'online-presencial',
  'presencial',
  'intensiva',
  'educacion',
  'rehabilitacion',
]);
const short = z.string().trim().min(1).max(250);
const personalAnswers = z
  .object({
    profile: z.literal('personal').default('personal'),
    dogAge: short,
    dogBreed: short,
    obstacle: z.string().trim().min(1).max(2000),
    desired: z.string().trim().min(1).max(2000),
    timing: z.enum(['now', 'month', 'browsing']),
    format: z.enum(['online', 'presencial', 'mixed']),
    modality: z.enum(['intensive', 'extensive']).optional(),
    fourDayTravel: z.enum(['yes', 'no']).optional(),
    combine: z.enum(['mixed', 'presencial']).optional(),
    sevilleResident: z.enum(['yes', 'no']).optional(),
    alternativeFormat: z.enum(['online', 'mixed']).optional(),
    onlineFallback: z.literal('yes').optional(),
    individualService: z.enum(['intensiva', 'educacion', 'rehabilitacion']).optional(),
    investment: z.enum(['entry', 'standard', 'plus']),
    interest: code,
    recommendation: z.enum([
      'online',
      'online-presencial',
      'presencial',
      'intensiva',
      'educacion',
      'rehabilitacion',
      'comunidad',
    ]),
  })
  .superRefine((a, c) => {
    let interest: string | undefined;
    if (a.format === 'online') interest = 'online';
    else if (a.format === 'presencial' && a.modality === 'extensive') {
      if (a.sevilleResident === 'yes') interest = a.individualService;
      else if (a.sevilleResident === 'no' && a.alternativeFormat === 'online') interest = 'online';
      else if (a.sevilleResident === 'no' && a.alternativeFormat === 'mixed')
        interest =
          a.fourDayTravel === 'yes'
            ? 'online-presencial'
            : a.fourDayTravel === 'no' && a.onlineFallback === 'yes'
              ? 'online'
              : undefined;
    } else if (a.format === 'mixed' || (a.format === 'presencial' && a.modality === 'intensive')) {
      if (a.fourDayTravel === 'no' && a.onlineFallback === 'yes') interest = 'online';
      else if (a.fourDayTravel === 'yes')
        interest =
          a.format === 'mixed' || a.combine === 'mixed'
            ? 'online-presencial'
            : a.combine === 'presencial'
              ? 'presencial'
              : undefined;
    }
    if (!interest || interest !== a.interest)
      c.addIssue({
        code: 'custom',
        path: ['interest'],
        message: 'El servicio de interés no corresponde al recorrido.',
      });
    if (a.recommendation !== (a.investment === 'entry' ? 'comunidad' : interest))
      c.addIssue({
        code: 'custom',
        path: ['recommendation'],
        message: 'Revisa la inversión y la recomendación.',
      });
  });
const professionalAnswers = z
  .object({
    profile: z.enum(['professional', 'future']),
    profession: z.enum(['training', 'care', 'other']).optional(),
    experience: z.enum(['under-one', 'one-five', 'over-five']).optional(),
    previousTraining: z.enum(['yes', 'no']).optional(),
    trainingDetails: z.string().trim().min(1).max(2000).optional(),
    goal: z.enum(['theory', 'practice', 'both']).optional(),
    beginnerGoal: z.enum(['online', 'pack']).optional(),
    budget: z.enum(['low', 'medium', 'high']),
    travel: z.enum(['yes', 'no']).optional(),
    includeTheory: z.enum(['yes', 'no']).optional(),
    recommendation: z.enum(['online', 'online-presencial', 'presencial', 'comunidad']),
  })
  .superRefine((a, c) => {
    let valid = true;
    if (a.profile === 'professional') valid = Boolean(a.profession && a.experience && a.goal);
    else
      valid =
        a.previousTraining === 'yes'
          ? Boolean(a.trainingDetails && a.goal)
          : a.previousTraining === 'no' && Boolean(a.beginnerGoal);
    const practical = a.goal === 'practice' || a.goal === 'both' || a.beginnerGoal === 'pack';
    if (a.budget !== 'low' && practical && !a.travel) valid = false;
    if (a.budget !== 'low' && a.goal === 'practice' && a.travel === 'yes' && !a.includeTheory)
      valid = false;
    const result =
      a.budget === 'low'
        ? 'comunidad'
        : practical && a.travel === 'yes'
          ? a.goal === 'practice' && a.includeTheory === 'no'
            ? 'presencial'
            : 'online-presencial'
          : 'online';
    if (!valid || result !== a.recommendation)
      c.addIssue({
        code: 'custom',
        path: ['recommendation'],
        message: 'Completa las respuestas del recorrido.',
      });
  });
export const quizLeadSchema = z
  .object({
    submissionKey: z.uuid(),
    name: z.string().trim().min(2).max(255),
    phone: z
      .string()
      .trim()
      .max(40)
      .regex(/^[+\d\s().-]+$/),
    phoneCountry: z.enum(getCountries()).default('ES'),
    privacyAccepted: z.literal(true),
    privacyVersion: z.literal(privacyVersion),
    website: z.string().max(0).optional(),
    answers: z.union([personalAnswers, professionalAnswers]),
  })
  .superRefine((b, c) => {
    const phone = parsePhoneNumberFromString(b.phone, b.phoneCountry);
    if (!phone?.isPossible() || phone.countryCallingCode !== getCountryCallingCode(b.phoneCountry))
      c.addIssue({
        code: 'custom',
        path: ['phone'],
        message: 'Indica un teléfono válido para el país seleccionado.',
      });
  })
  .transform((b) => ({ ...b, phone: parsePhoneNumberFromString(b.phone, b.phoneCountry)!.number }));
