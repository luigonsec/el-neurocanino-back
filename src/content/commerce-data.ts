import {
  stripeLinks20261028,
  reservePaymentUrl,
  consultation20261028,
} from './stripe-links-20261028';
import { programPresentation20261028 } from './program-presentation-20261028';
import { programs20261028 } from './programs-20261028';
export const DEMO_CALENDLY_URL = 'https://calendly.com/iris-cloud/conoce-iris-cloud';
export const PACK_ROUTE = '/servicios/programa-online-presencial/';
const baseDefaults = [
  {
    code: 'comunidad',
    title: 'Comunidad',
    description:
      'Comparte experiencias y casos con otros profesionales en el Club de Integración Canina. El acceso y las condiciones de la comunidad se gestionan en Skool.',
    serviceCodes: ['comunidad'],
    options: [],
  },
  {
    ...programs20261028.find((p) => p.code === 'online')!,
    ...programPresentation20261028.find((p) => p.code === 'online')!,
    serviceCodes: ['online'],
  },
  {
    ...programs20261028.find((p) => p.code === 'presencial')!,
    ...programPresentation20261028.find((p) => p.code === 'presencial')!,
    serviceCodes: ['presencial'],
  },
  {
    ...consultation20261028,
    serviceCodes: ['intensiva'],
    options: [
      {
        label: 'Consulta individual · una hora',
        method: 'stripe',
        amountCents: 7500,
        paymentType: 'full',
      },
    ],
  },
  {
    code: 'educacion',
    title: 'Adiestramiento y educación',
    description:
      'Cuatro semanas, con una sesión individual de tres horas cada semana. Contrata el programa y acuerda las sesiones con el instructor.',
    serviceCodes: ['educacion'],
    options: [
      { label: 'Programa completo · cuatro semanas', method: 'calendly', amountCents: 90000 },
    ],
  },
  {
    code: 'rehabilitacion',
    title: 'Modificación de Comportamiento',
    description:
      'Seis semanas, con una sesión individual de tres horas cada semana. Contrata el programa y acuerda las sesiones con el instructor.',
    serviceCodes: ['rehabilitacion'],
    options: [
      { label: 'Programa completo · seis semanas', method: 'calendly', amountCents: 130000 },
    ],
  },
  {
    ...programs20261028.find((p) => p.code === 'online-presencial')!,
    ...programPresentation20261028.find((p) => p.code === 'online-presencial')!,
    serviceCodes: ['online', 'presencial'],
  },
] as const;

export const commercialDefaults = baseDefaults.map((offer) => ({
  ...offer,
  options: offer.options.map((option) => {
    const o = option as any;
    const link = stripeLinks20261028.find(
      (p) =>
        p.code === offer.code &&
        p.amount === o.amountCents &&
        p.count === (o.installmentCount || 1) &&
        p.deposit === (o.depositCents || 0) &&
        p.balance === (o.balanceCents || 0),
    );
    return link
      ? {
          ...o,
          method: 'stripe',
          paymentUrl: link.url,
          depositPaymentUrl: link.deposit ? reservePaymentUrl : null,
        }
      : o;
  }),
}));
