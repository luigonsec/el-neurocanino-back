import 'reflect-metadata';
import { applicationSchema, contactSchema, qualification } from '../src/leads/schemas';
import { privacyVersion } from '../src/privacy';
import { calendlyUrl } from '../src/validation';
import { csvCell } from '../src/leads/leads';
const base = {
  submissionKey: '12345678-1234-4234-8234-123456789012',
  name: 'Persona de prueba',
  email: 'TEST@example.com',
  phone: '612345678',
  privacyAccepted: true,
  privacyVersion,
  program: 'online',
  answers: {
    profile: 'personal',
    problem: 'Quiero trabajar los paseos',
    goal: 'Pasear con tranquilidad',
    urgency: 'now',
    budget: 'medium',
  },
};
describe('Solicitudes y cualificación', () => {
  for (const profile of ['personal', 'professional'])
    for (const budget of ['low', 'medium', 'high'])
      for (const program of ['online', 'complete'])
        for (const travel of program === 'complete' ? ['yes', 'no'] : [undefined]) {
          it(`${program}, ${profile}, ${budget}, desplazamiento ${travel}`, () => {
            const answers = {
              profile,
              ...(profile === 'personal'
                ? { problem: 'Un problema concreto' }
                : { experience: 'future' }),
              goal: 'Quiero aprender',
              urgency: 'exploring',
              budget,
              ...(travel ? { travel } : {}),
            };
            const input = applicationSchema.parse({ ...base, program, answers });
            expect(input.phone).toBe('+34612345678');
            expect(input.email).toBe('test@example.com');
            expect(qualification(input)).toBe(
              budget === 'low'
                ? 'community'
                : program === 'complete' && travel === 'yes'
                  ? 'complete'
                  : 'online',
            );
          });
        }
  it('exige consentimiento, email, teléfono, rama completa y desplazamiento', () => {
    for (const change of [
      { privacyAccepted: false },
      { email: 'no' },
      { phone: '1' },
      { program: 'complete' },
      { answers: { ...base.answers, problem: '' } },
      { answers: { ...base.answers, profile: 'professional' } },
    ])
      expect(applicationSchema.safeParse({ ...base, ...change }).success).toBe(false);
  });
  it('no acepta resultados impuestos, campos de otra rama ni preguntas de desplazamiento en online', () => {
    expect(applicationSchema.safeParse({ ...base, outcome: 'complete' }).success).toBe(false);
    expect(
      applicationSchema.safeParse({ ...base, answers: { ...base.answers, travel: 'yes' } }).success,
    ).toBe(false);
    expect(
      applicationSchema.safeParse({ ...base, answers: { ...base.answers, experience: 'future' } })
        .success,
    ).toBe(false);
  });
  it('rechaza honeypot y versión de privacidad incorrecta', () => {
    expect(applicationSchema.safeParse({ ...base, website: 'autofilled' }).success).toBe(true);
    expect(applicationSchema.safeParse({ ...base, privacyVersion: 'old' }).success).toBe(false);
  });
  it('contacto no acepta parámetros de servicios ni eventos', () => {
    const { answers, program, ...identity } = base;
    expect(
      contactSchema.safeParse({ ...identity, message: 'Quiero organizar un evento en mi ciudad.' })
        .success,
    ).toBe(true);
    expect(
      contactSchema.safeParse({
        ...identity,
        message: 'Propuesta de evento',
        serviceCode: 'online',
      }).success,
    ).toBe(false);
  });
  it('solo permite agendas HTTPS reales de Calendly y neutraliza fórmulas CSV', () => {
    expect(
      calendlyUrl.safeParse('https://calendly.com/adiestracaninos/asesoramiento-personalizado')
        .success,
    ).toBe(true);
    for (const url of [
      'http://calendly.com/a/b',
      'https://calendly.com.evil.test/a/b',
      'https://user:pass@calendly.com/a/b',
      'https://calendly.com/',
    ])
      expect(calendlyUrl.safeParse(url).success).toBe(false);
    expect(csvCell('=1+1')).toBe('"\'=1+1"');
  });
});
