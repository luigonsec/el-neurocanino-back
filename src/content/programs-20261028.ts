// Commercial conditions approved by the client on 28 October 2026.
// Keep this snapshot stable: it is also used by the data migration.
export const programs20261028 = [
  {
    code: 'online',
    title: 'Programa online — Formación teórica',
    description:
      'Aprende la Metodología de Integración Canina desde Skool, para mejorar la convivencia con tu perro o desarrollar tu práctica profesional. Elige pago único o un plan de 3, 6 o 12 cuotas.',
    options: [
      { label: 'Pago único', method: 'transfer', paymentType: 'full', amountCents: 100000 },
      {
        label: '6 meses',
        method: 'stripe',
        paymentType: 'installments',
        amountCents: 18500,
        installmentCount: 6,
      },
      {
        label: '12 meses',
        method: 'stripe',
        paymentType: 'installments',
        amountCents: 9900,
        installmentCount: 12,
      },
      {
        label: '3 meses',
        method: 'stripe',
        paymentType: 'installments',
        amountCents: 35000,
        installmentCount: 3,
      },
    ],
  },
  {
    code: 'presencial',
    title: 'Programa presencial — Formación práctica de 4 días',
    description:
      'Cuatro días para trabajar dificultades de comportamiento y convivencia o aprender la aplicación práctica de la metodología. Elige tu edición y paga el programa completo o reserva tu plaza sin recargo. No se ofrece financiación mensual para este programa independiente.',
    options: [
      { label: 'Pago completo', method: 'transfer', paymentType: 'full', amountCents: 150000 },
      {
        label: 'Reserva de plaza',
        method: 'stripe',
        paymentType: 'reservation',
        amountCents: 35000,
        balanceCents: 115000,
      },
    ],
  },
  {
    code: 'online-presencial',
    title: 'Programa completo — Formación online + presencial',
    route: '/servicios/programa-online-presencial/',
    seoTitle: 'Programa completo online + presencial canino | El Neurocanino',
    seoDescription:
      'Formación teórica online y cuatro días de práctica presencial. Desde 149 €/mes más 350 € de reserva, o 2.000 € en pago único. Consulta todas las modalidades.',
    description:
      'La propuesta más completa para particulares y personas que quieren formarse: preparación teórica online, cuatro días de práctica presencial y tres meses de seguimiento online incluidos en el Programa online. La contratación se vincula a la edición elegida.',
    options: [
      { label: 'Pago único', method: 'transfer', paymentType: 'full', amountCents: 200000 },
      {
        label: '6 meses + reserva',
        method: 'stripe',
        paymentType: 'installments',
        amountCents: 29000,
        installmentCount: 6,
        depositCents: 35000,
      },
      {
        label: '12 meses + reserva',
        method: 'stripe',
        paymentType: 'installments',
        amountCents: 14900,
        installmentCount: 12,
        depositCents: 35000,
      },
      {
        label: '3 meses + reserva',
        method: 'stripe',
        paymentType: 'installments',
        amountCents: 56500,
        installmentCount: 3,
        depositCents: 35000,
      },
    ],
  },
] as const;
export const servicePrograms20261028 = [
  {
    code: 'online',
    title: 'Programa online — Formación teórica',
    label: 'Comprender para avanzar',
    intro:
      'Aprende la Metodología de Integración Canina para mejorar la convivencia con tu perro o formarte profesionalmente.',
    description:
      'Una formación teórica online alojada en Skool para comprender el comportamiento, abordar las dificultades de convivencia y aplicar la Metodología de Integración Canina. Dirigida a particulares, futuros profesionales y profesionales. Puedes cursarla de forma independiente o combinarla con cuatro días de práctica en el Programa completo.',
    seoTitle: 'Programa online de educación y comportamiento canino | El Neurocanino',
    seoDescription:
      'Aprende la Metodología de Integración Canina a tu ritmo. Formación para particulares y profesionales: 1.000 € en pago único o desde 99 €/mes durante 12 meses.',
  },
  {
    code: 'presencial',
    title: 'Programa presencial — Formación práctica de 4 días',
    label: 'La metodología llevada a la práctica',
    intro:
      'Cuatro días de trabajo práctico para abordar dificultades de convivencia y aprender a aplicar la metodología.',
    description:
      'Una experiencia práctica de cuatro días para personas que necesitan trabajar problemas graves de comportamiento o convivencia y para quienes quieren aprender el sistema práctico de la Metodología de Integración Canina. Consulta las fechas y plazas de cada edición. Puedes contratarla por separado o junto al Programa online en el Programa completo.',
    seoTitle: 'Formación canina presencial de 4 días | El Neurocanino',
    seoDescription:
      'Cuatro días de formación práctica canina. Precio total de 1.500 €: pago completo o reserva de 350 € y 1.150 € al comenzar. Consulta próximas ediciones.',
  },
] as const;
