import 'reflect-metadata';
import { eventSchema, eventAvailability, madridToday } from '../src/events/events';
import { eventStatusEmail, leadNotification } from '../src/emails/notifications';
import { brandLogo } from '../src/emails/brand';
import type { EventRegistration, TrainingEvent, Lead } from '../src/database/entities';
const event = {
  id: 1,
  title: 'Encuentro canino',
  description: 'Práctica compartida en Sevilla.',
  location: 'Centro de formación',
  city: 'Sevilla',
  startDate: '2027-05-01',
  endDate: '2027-05-04',
  image: null,
  capacity: 2,
  published: true,
  status: 'open',
} as TrainingEvent;
describe('Eventos, aforo y correo', () => {
  it('respeta el calendario de Madrid en invierno y verano', () => {
    expect(madridToday(new Date('2026-11-21T23:30:00Z'))).toBe('2026-11-22');
    expect(madridToday(new Date('2026-07-01T22:30:00Z'))).toBe('2026-07-02');
  });
  it('cierra eventos pasados, completos, borradores y cancelados', () => {
    expect(eventAvailability(event, 1, '2027-05-01')).toEqual({
      placesAvailable: 1,
      registrationOpen: true,
    });
    for (const value of [
      { ...event, published: false },
      { ...event, status: 'cancelled' as const },
      { ...event, status: 'closed' as const },
      { ...event, endDate: '2026-01-01' },
    ])
      expect(eventAvailability(value, 0, '2027-05-01').registrationOpen).toBe(false);
    expect(eventAvailability(event, 2, '2027-05-01').registrationOpen).toBe(false);
  });
  it('rechaza fechas invertidas y aforo nulo', () => {
    const { id, ...fields } = event;
    expect(eventSchema.safeParse(fields).success).toBe(true);
    expect(eventSchema.safeParse({ ...fields, endDate: '2026-01-01' }).success).toBe(false);
    expect(eventSchema.safeParse({ ...fields, capacity: 0 }).success).toBe(false);
  });
  it('distingue recepción pendiente de aceptación y escapa contenido', () => {
    const registration = { name: '<script>Persona</script>' } as EventRegistration;
    const pending = eventStatusEmail(registration, event, 'pending');
    expect(pending.text).toContain('no confirma una plaza');
    expect(pending.html).toContain('&lt;script&gt;');
    expect(pending.html).not.toContain('<script>');
    expect(pending.html).toContain(`cid:${brandLogo.cid}`);
    expect(eventStatusEmail(registration, event, 'accepted').text).toContain(
      'tu plaza está confirmada',
    );
    expect(eventStatusEmail(registration, event, 'rejected').text).toContain(
      'no hemos podido aceptar',
    );
    expect(eventStatusEmail(registration, event, 'cancelled').text).toContain(
      'ya no tienes una plaza reservada',
    );
  });
  it('los avisos conservan origen y derivación de programa', () => {
    const email = leadNotification(
      {
        category: 'complete',
        name: 'Ana',
        email: 'ana@example.test',
        phone: '+34612345678',
        answers: { travel: 'no', budget: 'medium', goal: 'online' },
        outcome: 'online',
      } as unknown as Lead,
      'https://example.test',
    );
    expect(email.subject).toContain('Programa completo');
    expect(email.text).toContain('Resultado: Programa online');
    expect(email.text).toContain('Objetivo: online');
  });
});
