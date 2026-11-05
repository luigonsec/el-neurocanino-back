import Stripe from 'stripe';
import { ServiceUnavailableException } from '@nestjs/common';
import { config } from '../config';
export function sandboxClient() {
  if (
    config.STRIPE_MODE !== 'sandbox' ||
    config.APP_ENV === 'production' ||
    !/^(sk|rk)_test_/.test(config.STRIPE_SECRET_KEY)
  )
    throw new ServiceUnavailableException(
      'El pago de pruebas no está configurado. No se utilizarán enlaces reales.',
    );
  return new Stripe(config.STRIPE_SECRET_KEY, { maxNetworkRetries: 2, timeout: 20000 });
}
let accountCheck: Promise<void> | undefined;
export async function checkedStripe() {
  const stripe = sandboxClient();
  accountCheck ||= stripe.accounts
    .retrieve(config.STRIPE_ACCOUNT_ID)
    .then((a) => {
      if (a.id !== config.STRIPE_ACCOUNT_ID)
        throw new Error('La cuenta Stripe no corresponde al sandbox autorizado.');
    })
    .catch((e) => {
      accountCheck = undefined;
      throw e;
    });
  await accountCheck;
  return stripe;
}
export function assertTest(object: { livemode?: boolean }) {
  if (object.livemode !== false)
    throw new Error('Se ha rechazado un objeto ajeno al entorno de pruebas.');
}
