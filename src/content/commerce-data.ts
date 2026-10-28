import { programs20261028 } from './programs-20261028';
export const DEMO_CALENDLY_URL = 'https://calendly.com/iris-cloud/conoce-iris-cloud';
export const PACK_ROUTE = '/servicios/programa-online-presencial/';
export const commercialDefaults = [
  {
    code: 'comunidad',
    title: 'Comunidad',
    description:
      'Comparte experiencias y casos con otros profesionales en el Club de Integración Canina. El acceso y las condiciones de la comunidad se gestionan en Skool.',
    serviceCodes: ['comunidad'],
    options: [],
  },
  { ...programs20261028.find((p) => p.code === 'online')!, serviceCodes: ['online'] },
  { ...programs20261028.find((p) => p.code === 'presencial')!, serviceCodes: ['presencial'] },
  {
    code: 'intensiva',
    title: 'Sesión Intensiva en Sevilla',
    description:
      'Una sesión individual de tres horas en Sevilla para trabajar una situación concreta. La reserva y el pago se completarán en el calendario definitivo.',
    serviceCodes: ['intensiva'],
    options: [],
  },
  {
    code: 'educacion',
    title: 'Adiestramiento y educación',
    description:
      'Cuatro semanas, con una sesión de tres horas cada semana. Selecciona la primera sesión y abona el programa completo; las siguientes se acuerdan con el instructor.',
    serviceCodes: ['educacion'],
    options: [
      { label: 'Programa completo · cuatro semanas', method: 'calendly', amountCents: 90000 },
    ],
  },
  {
    code: 'rehabilitacion',
    title: 'Modificación de Comportamiento',
    description:
      'Seis semanas, con una sesión de tres horas cada semana. Reserva la primera sesión y acuerda las siguientes con el instructor.',
    serviceCodes: ['rehabilitacion'],
    options: [
      { label: 'Programa completo · seis semanas', method: 'calendly', amountCents: 130000 },
    ],
  },
  {
    ...programs20261028.find((p) => p.code === 'online-presencial')!,
    serviceCodes: ['online', 'presencial'],
  },
] as const;
