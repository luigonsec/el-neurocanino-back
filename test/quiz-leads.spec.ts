import { quizLeadSchema } from '../src/leads/quiz-schema';
import { privacyVersion } from '../src/privacy';
const lead = {
  submissionKey: '209b9b97-3591-4dc5-9bd6-0975321867e9',
  name: 'Ana',
  phone: '600123456',
  privacyAccepted: true,
  privacyVersion,
  answers: {
    dogAge: '2 años',
    dogBreed: 'No lo sé',
    obstacle: 'Paseos',
    desired: 'Pasear tranquilos',
    timing: 'now',
    format: 'online',
    investment: 'standard',
    interest: 'online',
    recommendation: 'online',
  },
};
it('acepta teléfono sin email y separa interés de recomendación', () => {
  expect(quizLeadSchema.safeParse(lead).success).toBe(true);
  expect(
    quizLeadSchema.safeParse({
      ...lead,
      answers: { ...lead.answers, investment: 'entry', recommendation: 'comunidad' },
    }).success,
  ).toBe(true);
});
it('valida consentimiento, teléfono, categorías y restricciones del recorrido', () => {
  for (const change of [
    { phone: 'abc' },
    { privacyAccepted: false },
    { privacyVersion: 'invalida' },
    { answers: { ...lead.answers, investment: '50-100' } },
    { answers: { ...lead.answers, recommendation: 'comunidad' } },
    {
      answers: {
        ...lead.answers,
        format: 'mixed',
        fourDayTravel: 'no',
        interest: 'online-presencial',
        recommendation: 'online-presencial',
      },
    },
    {
      answers: {
        ...lead.answers,
        format: 'presencial',
        modality: 'extensive',
        sevilleResident: 'no',
        interest: 'educacion',
        recommendation: 'educacion',
      },
    },
  ])
    expect(quizLeadSchema.safeParse({ ...lead, ...change }).success).toBe(false);
});
it('permite mixto con desplazamiento y atención individual únicamente a residentes', () => {
  expect(
    quizLeadSchema.safeParse({
      ...lead,
      answers: {
        ...lead.answers,
        format: 'mixed',
        fourDayTravel: 'yes',
        interest: 'online-presencial',
        recommendation: 'online-presencial',
      },
    }).success,
  ).toBe(true);
  expect(
    quizLeadSchema.safeParse({
      ...lead,
      answers: {
        ...lead.answers,
        format: 'presencial',
        modality: 'extensive',
        sevilleResident: 'yes',
        individualService: 'intensiva',
        interest: 'intensiva',
        recommendation: 'intensiva',
      },
    }).success,
  ).toBe(true);
});

it('acepta profesionales y futuros profesionales con contacto internacional y valida el país', () => {
  const input = {
    ...lead,
    phone: '06 12 34 56 78',
    phoneCountry: 'FR',
    answers: {
      profile: 'professional',
      profession: 'training',
      experience: 'one-five',
      goal: 'theory',
      budget: 'medium',
      recommendation: 'online',
    },
  };
  expect(quizLeadSchema.parse(input).phone).toBe('+33612345678');
  expect(quizLeadSchema.safeParse({ ...input, phoneCountry: 'ES' }).success).toBe(false);
  expect(
    quizLeadSchema.safeParse({
      ...input,
      answers: {
        profile: 'future',
        previousTraining: 'no',
        beginnerGoal: 'online',
        budget: 'low',
        recommendation: 'comunidad',
      },
    }).success,
  ).toBe(true);
  expect(
    quizLeadSchema.safeParse({
      ...input,
      answers: { ...input.answers, recommendation: 'presencial' },
    }).success,
  ).toBe(false);
});
