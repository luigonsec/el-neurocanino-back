// Public payment links supplied in stripe/payment_links.csv, checked on 28/10/2026.
// No secret keys. Instalment subscriptions are closed MANUALLY by the team.
export const reservePaymentUrl = 'https://buy.stripe.com/9B6cN7bgQ64H5I72cZcs80l';
export const blockedPaymentUrls = ['https://buy.stripe.com/bJe8wRacM78L9Yn3h3cs80c']; // Incorrect: 2,000 EUR/month, not a single payment.
export const stripeLinks20261028 = [
  {
    code: 'online',
    count: 1,
    amount: 100000,
    deposit: 0,
    balance: 0,
    url: 'https://buy.stripe.com/dRm14pgBagJl8UjbNzcs808',
  },
  {
    code: 'online',
    count: 3,
    amount: 35000,
    deposit: 0,
    balance: 0,
    url: 'https://buy.stripe.com/9B65kF98I0KnfiHbNzcs809',
  },
  {
    code: 'online',
    count: 6,
    amount: 18500,
    deposit: 0,
    balance: 0,
    url: 'https://buy.stripe.com/6oU4gBdoY50Dc6v4l7cs80a',
  },
  {
    code: 'online',
    count: 12,
    amount: 9900,
    deposit: 0,
    balance: 0,
    url: 'https://buy.stripe.com/fZu4gB0CcfFh5I73h3cs80b',
  },
  {
    code: 'presencial',
    count: 1,
    amount: 150000,
    deposit: 0,
    balance: 0,
    url: 'https://buy.stripe.com/bJebJ3et2dx94E35pbcs80k',
  },
  {
    code: 'presencial',
    count: 1,
    amount: 35000,
    deposit: 0,
    balance: 115000,
    url: reservePaymentUrl,
  },
  {
    code: 'online-presencial',
    count: 3,
    amount: 56500,
    deposit: 35000,
    balance: 0,
    url: 'https://buy.stripe.com/9B6aEZ5Ww0Kn0nN2cZcs80d',
  },
  {
    code: 'online-presencial',
    count: 6,
    amount: 29000,
    deposit: 35000,
    balance: 0,
    url: 'https://buy.stripe.com/14AeVfdoYakX4E3aJvcs80e',
  },
  {
    code: 'online-presencial',
    count: 12,
    amount: 14900,
    deposit: 35000,
    balance: 0,
    url: 'https://buy.stripe.com/14AfZj0Cc0Kn1rR6tfcs80f',
  },
  {
    code: 'educacion',
    count: 1,
    amount: 90000,
    deposit: 0,
    balance: 0,
    url: 'https://buy.stripe.com/eVq9AV3Oodx9dazg3Pcs80i',
  },
  {
    code: 'rehabilitacion',
    count: 1,
    amount: 130000,
    deposit: 0,
    balance: 0,
    url: 'https://buy.stripe.com/28EcN7gBa2Sv0nN4l7cs80j',
  },
  {
    code: 'intensiva',
    count: 1,
    amount: 7500,
    deposit: 0,
    balance: 0,
    url: 'https://buy.stripe.com/14A9AV84EeBdfiH7xjcs80g',
  },
] as const;
export const consultation20261028 = {
  code: 'intensiva',
  title: 'Consulta presencial en Sevilla',
  label: 'Una consulta sobre tu caso',
  intro:
    'Una hora de atención individual en Sevilla para revisar tu situación y orientar los siguientes pasos. Precio: 75 €.',
  description:
    'Una consulta presencial individual de una hora en Sevilla para comprender tu situación, revisar lo que necesitas y orientarte sobre cómo continuar con tu perro. Precio: 75 € en un único pago. Tras contratar la consulta, acuerda la fecha con el instructor.',
  seoTitle: 'Consulta presencial canina en Sevilla · 1 hora, 75 € | El Neurocanino',
  seoDescription:
    'Consulta individual de una hora en Sevilla para revisar tu situación con tu perro y orientar los siguientes pasos. Precio: 75 €. Cita acordada con el instructor.',
};
