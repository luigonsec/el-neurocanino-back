// Presentation-only revision. Payment conditions remain in the approved price snapshot.
export const programPresentation20261028 = [
  {
    code: 'online',
    title: 'Programa online de Integración Canina',
    label: 'Comprende la metodología. Aplícala en tu día a día.',
    intro:
      'Aprende la Metodología de Integración Canina para convivir mejor con tu perro o desarrollar tu práctica profesional, desde cualquier lugar.',
    description:
      'Una formación teórica online alojada en Skool para particulares, futuros profesionales y profesionales. Comprende el comportamiento y aprende a aplicar la Metodología de Integración Canina a la convivencia y al trabajo con perros. Incluye acceso de por vida al contenido online y tres meses de seguimiento personalizado. Puedes realizarla de forma independiente o preparar las bases antes de los cuatro días de práctica del Programa completo.',
    seoTitle: 'Programa online de Integración Canina | El Neurocanino',
    seoDescription:
      'Formación online para particulares y profesionales, con acceso de por vida al contenido y tres meses de seguimiento personalizado. Consulta precios y modalidades.',
  },
  {
    code: 'presencial',
    title: 'Programa presencial intensivo de 4 días',
    label: 'La metodología llevada a la práctica',
    intro:
      'Cuatro días de práctica para profesionales y futuros profesionales, también abiertos a particulares que quieran aprender a trabajar con su perro.',
    description:
      'Una formación práctica intensiva de cuatro días para aprender a aplicar la Metodología de Integración Canina. Dirigida principalmente a profesionales y futuros profesionales, y también a particulares que quieran profundizar en el trabajo con su perro. Consulta las fechas y plazas de cada edición. Puedes realizarla por separado o combinar preparación online, práctica presencial y seguimiento personalizado posterior en el Programa completo.',
    seoTitle: 'Programa presencial intensivo de 4 días | El Neurocanino',
    seoDescription:
      'Formación práctica canina de cuatro días para profesionales y particulares. 1.500 €: pago completo o reserva de 350 € y 1.150 € al comenzar. Consulta ediciones.',
  },
  {
    code: 'online-presencial',
    title: 'Programa completo — Online + Presencial',
    description:
      'La propuesta más completa para particulares, futuros profesionales y profesionales: preparación online con acceso de por vida al contenido, cuatro días de práctica presencial y tres meses de seguimiento personalizado online que comienzan al finalizar la formación presencial. La contratación se vincula a la edición elegida.',
    seoTitle: 'Programa completo online + presencial canino | El Neurocanino',
    seoDescription:
      'Preparación online, cuatro días de práctica y tres meses de seguimiento personalizado tras el presencial. 2.000 € en pago único. Consulta modalidades y ediciones.',
  },
] as const;
export const servicePresentation20261028 = programPresentation20261028.filter(
  (
    program,
  ): program is Exclude<
    (typeof programPresentation20261028)[number],
    { code: 'online-presencial' }
  > => program.code !== 'online-presencial',
);
