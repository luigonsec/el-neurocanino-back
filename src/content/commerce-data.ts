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
  {
    code: 'online',
    title: 'Programa Online',
    description:
      'Formación online alojada en Skool. Elige pago completo por transferencia o doce mensualidades mediante Stripe. También puedes concertar una cita de información y admisión.',
    serviceCodes: ['online'],
    options: [
      { label: 'Pago completo por transferencia', method: 'transfer', amountCents: 100000 },
      {
        label: 'Pago mensual con Stripe',
        method: 'stripe',
        amountCents: 9900,
        installmentCount: 12,
      },
    ],
  },
  {
    code: 'presencial',
    title: 'Programa presencial de 4 días',
    description:
      'Cuatro días de formación presencial. Elige una edición abierta con plazas disponibles para consultar las opciones de contratación.',
    serviceCodes: ['presencial'],
    options: [
      { label: 'Pago completo por transferencia', method: 'transfer', amountCents: 150000 },
      {
        label: 'Tres mensualidades con Stripe',
        method: 'stripe',
        amountCents: 55000,
        installmentCount: 3,
      },
    ],
  },
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
    code: 'online-presencial',
    title: 'Programa Online + Programa presencial de 4 días',
    route: PACK_ROUTE,
    seoTitle: 'Pack Programa Online + Presencial de 4 días | El Neurocanino',
    seoDescription:
      'Combina el Programa Online con cuatro días de formación presencial. Conoce el pack, sus opciones de pago y elige tu edición.',
    description:
      'Combina la formación online con una edición del programa presencial de cuatro días. La contratación se vincula a la edición elegida.',
    serviceCodes: ['online', 'presencial'],
    options: [
      { label: 'Pago completo', method: 'transfer', amountCents: 200000 },
      {
        label: 'Reserva y doce mensualidades con Stripe',
        method: 'stripe',
        amountCents: 14900,
        installmentCount: 12,
        depositCents: 35000,
      },
    ],
  },
] as const;
