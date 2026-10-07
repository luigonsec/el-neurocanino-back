import { editionSchema, serviceSchema } from '../src/validation';
const edition = {
  title: 'Práctica en Sevilla',
  location: 'Campo de trabajo',
  city: 'Sevilla',
  province: 'Sevilla',
  startDate: '2026-12-01',
  endDate: '2026-12-02',
  description: 'Práctica en grupos reducidos.',
  capacity: 12,
  placesAvailable: 8,
  photos: ['/images/training.jpg'],
  calendlyUrl: null,
  published: true,
  isDemo: false,
};
describe('Ediciones y acciones', () => {
  it('valida orden de fechas y capacidad de plazas', () => {
    expect(editionSchema.safeParse(edition).success).toBe(true);
    expect(editionSchema.safeParse({ ...edition, endDate: '2026-11-30' }).success).toBe(false);
    expect(editionSchema.safeParse({ ...edition, placesAvailable: 13 }).success).toBe(false);
    expect(editionSchema.safeParse({ ...edition, placesAvailable: 0 }).success).toBe(true);
  });
  it('impide scripts y dominios distintos en Calendly', () => {
    const s = {
      title: 'Comunidad',
      label: 'Un espacio para aprender',
      intro: 'Una introducción completa.',
      description: 'Descripción del servicio.',
      outcomes: ['Trabajo en grupo'],
      image: '/images/training.jpg',
      actionMode: 'calendly',
    };
    expect(serviceSchema.safeParse({ ...s, actionUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(
      serviceSchema.safeParse({ ...s, actionUrl: 'https://calendly.com.evil.test/persona' })
        .success,
    ).toBe(false);
    expect(
      serviceSchema.safeParse({ ...s, actionUrl: 'https://calendly.com/persona/sesion' }).success,
    ).toBe(true);
  });
});
