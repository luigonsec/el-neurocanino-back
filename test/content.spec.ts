import { editionStatus, madridToday } from '../src/content/edition-status';
import { editionSchema, serviceSchema, serviceOutcomeSchema } from '../src/validation';
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
      outcomes: [{ title: 'Trabajo en grupo', description: 'Práctica y revisión compartida.' }],
      image: '/images/training.jpg',
      actionMode: 'calendly',
    };
    expect(
      serviceSchema.safeParse({ ...s, cardImage: '/media/custom-card.webp', actionUrl: null })
        .success,
    ).toBe(true);
    expect(
      serviceSchema.safeParse({
        ...s,
        cardImage: 'https://external.test/image.png',
        actionUrl: null,
      }).success,
    ).toBe(false);
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

describe('Cierre de ediciones', () => {
  it('mantiene abiertas las ediciones en curso y cierra al terminar el último día', () => {
    expect(editionStatus({ status: 'open', endDate: '2026-10-07' }, '2026-10-07')).toBe('open');
    expect(editionStatus({ status: 'open', endDate: '2026-10-07' }, '2026-10-08')).toBe('closed');
    expect(editionStatus({ status: 'closed', endDate: '2090-01-01' }, '2026-10-07')).toBe('closed');
    expect(madridToday(new Date('2026-10-07T22:30:00Z'))).toBe('2026-10-08');
  });
  it('rechaza estados desconocidos', () => {
    expect(editionSchema.safeParse({ ...edition, status: 'inventado' }).success).toBe(false);
  });
});

describe('Puntos del recorrido', () => {
  it('requiere estructura de título y descripción y rechaza IDs inválidos', () => {
    expect(serviceOutcomeSchema.safeParse('Trabajo en grupo').success).toBe(false);
    expect(
      serviceOutcomeSchema.safeParse({ title: 'Trabajo en grupo', description: 'Una descripción.' })
        .success,
    ).toBe(true);
    expect(serviceOutcomeSchema.safeParse({ title: 'X', description: '' }).success).toBe(false);
    expect(
      serviceOutcomeSchema.safeParse({ id: -1, title: 'Trabajo en grupo', description: '' })
        .success,
    ).toBe(false);
  });
});
