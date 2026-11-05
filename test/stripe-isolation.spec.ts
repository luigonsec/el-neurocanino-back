import { config } from '../src/config';
import { sandboxClient, assertTest } from '../src/payments/stripe-client';
import { publicOffer } from '../src/content/commerce';
const before = { ...config };
afterEach(() => Object.assign(config, before));
describe('Aislamiento de Stripe', () => {
  it('rechaza claves reales, modos desactivados y producción', () => {
    Object.assign(config, {
      STRIPE_MODE: 'sandbox',
      APP_ENV: 'development',
      STRIPE_SECRET_KEY: 'sk_test_fixture',
    });
    expect(() => sandboxClient()).not.toThrow();
    config.STRIPE_SECRET_KEY = 'sk_live_not_a_real_key';
    expect(() => sandboxClient()).toThrow();
    config.STRIPE_SECRET_KEY = 'sk_test_fixture';
    config.APP_ENV = 'production';
    expect(() => sandboxClient()).toThrow();
    config.APP_ENV = 'development';
    config.STRIPE_MODE = 'disabled';
    expect(() => sandboxClient()).toThrow();
    expect(() => assertTest({ livemode: true })).toThrow();
    expect(() => assertTest({})).toThrow();
  });
  it('no publica ni utiliza enlaces reales aunque falte la configuración local de pruebas', () => {
    config.STRIPE_MODE = 'disabled';
    const offer: any = {
      code: 'online',
      services: [{ code: 'online' }],
      options: [
        {
          id: 1,
          method: 'stripe',
          amountCents: 100000,
          installmentCount: 1,
          depositCents: 0,
          paymentUrl: 'https://buy.stripe.com/not_used',
          depositPaymentUrl: null,
        },
      ],
      provisional: false,
      published: true,
    };
    const local = publicOffer(offer, 'development');
    expect(local.options[0].paymentUrl).toBeNull();
    expect(local.options[0].hasPaymentLink).toBe(false);
    config.STRIPE_MODE = 'sandbox';
    const sandbox = publicOffer(offer, 'development');
    expect(sandbox.options[0].paymentUrl).toBeNull();
    expect(sandbox.options[0].hasPaymentLink).toBe(true);
  });
});
