import { programs20261028 } from '../src/content/programs-20261028';
import {
  paymentTotal,
  offerSchema,
  paymentOptionSchema,
  publicOffer,
  safeBooking,
  saveEditionPaymentLinks,
} from '../src/content/commerce';
import { DEMO_CALENDLY_URL } from '../src/content/commerce-data';
import { CommercialOffer, PaymentOption, EditionPaymentLink } from '../src/database/entities';
const option = {
  id: 1,
  offerId: 1,
  label: 'Doce mensualidades',
  method: 'stripe',
  currency: 'EUR',
  amountCents: 14900,
  installmentCount: 12,
  depositCents: 35000,
  paymentUrl: 'https://buy.stripe.com/test_example',
  whatsappUrl: 'https://wa.me/34600000000',
  transferInstructions: null,
  sortOrder: 0,
};
const offer = {
  id: 1,
  code: 'online',
  title: 'Programa Online',
  description: 'Una propuesta de formación y comunidad.',
  route: null,
  bookingUrl: null,
  provisional: true,
  published: true,
  klarnaEnabled: true,
  services: [{ code: 'online', title: 'Programa Online', route: '/servicios/programa-online/' }],
  options: [option],
} as unknown as CommercialOffer;
describe('Publicación y contratación de ofertas', () => {
  it('oculta precios provisionales y calendario de prueba en producción', () => {
    const result = publicOffer(offer, 'production');
    expect(result.options).toEqual([]);
    expect(result.bookingUrl).toBeNull();
    expect(result.klarnaEnabled).toBe(false);
    expect(JSON.stringify(result)).not.toContain('14900');
    expect(JSON.stringify(result)).not.toContain(DEMO_CALENDLY_URL);
    expect(safeBooking(DEMO_CALENDLY_URL, 'production')).toBeNull();
  });
  it('permite revisar el precio provisional sin activar enlaces reales de pago', () => {
    const result = publicOffer(offer, 'staging');
    expect(result.options[0].totalCents).toBe(213800);
    expect(result.options[0].paymentUrl).toBeNull();
    expect(result.options[0].whatsappUrl).toBeNull();
    expect(result.bookingUrl).toBe(DEMO_CALENDLY_URL);
    expect(result.bookingIsDemo).toBe(true);
  });
  it('mantiene el Calendly definitivo y solo anuncia Klarna tras configurarlo', () => {
    const result = publicOffer(
      { ...offer, provisional: false, bookingUrl: 'https://calendly.com/cliente/admisiones' },
      'production',
    );
    expect(result.bookingUrl).toContain('/cliente/');
    expect(result.bookingIsDemo).toBe(false);
    expect(result.klarnaEnabled).toBe(true);
    expect(result.options[0].paymentUrl).toBe(option.paymentUrl);
  });
  it('no expone un checkout genérico para reservar una edición presencial', () => {
    const result = publicOffer(
      { ...offer, provisional: false, services: [{ code: 'presencial' } as any] },
      'production',
    );
    expect(result.requiresEdition).toBe(true);
    expect(result.options[0].paymentUrl).toBeNull();
    expect(result.bookingUrl).toBeNull();
  });
  it('valida dinero entero, dominios y condiciones de pago', () => {
    expect(paymentOptionSchema.safeParse(option).success).toBe(true);
    for (const changes of [
      { amountCents: 99.9 },
      { amountCents: -10 },
      { installmentCount: 0 },
      { depositCents: -1 },
      { paymentUrl: 'https://buy.stripe.com.evil.test/pay' },
      { whatsappUrl: 'javascript:alert(1)' },
      { method: 'transfer', installmentCount: 12 },
    ])
      expect(paymentOptionSchema.safeParse({ ...option, ...changes }).success).toBe(false);
  });
  it('exige los componentes reales de los packs y rechaza opciones repetidas', () => {
    const draft = {
      ...offer,
      code: 'online-presencial',
      route: '/servicios/programa-online-presencial/',
      serviceCodes: ['online', 'presencial'],
    };
    expect(offerSchema.safeParse(draft).success).toBe(true);
    expect(offerSchema.safeParse({ ...draft, serviceCodes: ['online'] }).success).toBe(false);
    expect(offerSchema.safeParse({ ...draft, serviceCodes: ['comunidad', 'online'] }).success).toBe(
      false,
    );
    expect(offerSchema.safeParse({ ...draft, code: 'comunidad-online' }).success).toBe(false);
    expect(offerSchema.safeParse({ ...draft, options: [option, option] }).success).toBe(false);
  });
  it('impide asignar a una edición una opción de un servicio online independiente', async () => {
    const manager = {
      getRepository: (entity: unknown) =>
        entity === PaymentOption
          ? { find: async () => [{ ...option, offer: { services: [{ code: 'online' }] } }] }
          : entity === EditionPaymentLink
            ? { delete: jest.fn(), save: jest.fn() }
            : null,
    } as any;
    await expect(
      saveEditionPaymentLinks(manager, 1, [
        { paymentOptionId: 1, url: 'https://buy.stripe.com/test' },
      ]),
    ).rejects.toThrow('no corresponde');
  });
});

describe('Condiciones comerciales aprobadas', () => {
  it('calcula exactamente las diez modalidades sin duplicar reservas', () => {
    const totals = programs20261028.map((p) =>
      p.options.map((o) => {
        const parsed = paymentOptionSchema.parse({
          ...o,
          paymentUrl: null,
          transferInstructions: null,
          whatsappUrl: null,
        });
        return paymentTotal(parsed);
      }),
    );
    expect(totals).toEqual([
      [100000, 111000, 118800, 105000],
      [150000, 150000],
      [200000, 209000, 213800, 204500],
    ]);
  });
  it('separa reservas, cuotas y pagos completos y conserva clientes API anteriores', () => {
    const reservation = {
      ...option,
      paymentType: 'reservation',
      installmentCount: 1,
      amountCents: 35000,
      depositCents: 0,
      balanceCents: 115000,
    };
    expect(paymentOptionSchema.safeParse(reservation).success).toBe(true);
    expect(
      publicOffer({ ...offer, provisional: false, options: [reservation as any] }).options[0]
        .totalCents,
    ).toBe(150000);
    for (const invalid of [
      { balanceCents: 0 },
      { installmentCount: 3 },
      { depositCents: 35000 },
      { paymentType: 'full' },
    ])
      expect(paymentOptionSchema.safeParse({ ...reservation, ...invalid }).success).toBe(false);
    expect(paymentOptionSchema.safeParse(option).success).toBe(true);
  });
});
