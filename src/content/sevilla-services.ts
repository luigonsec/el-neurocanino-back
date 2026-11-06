// Existing codes and routes are retained to preserve references and historical enquiries.
export const calendlyServiceCodes = ['intensiva', 'educacion', 'rehabilitacion'] as const;

export const sevillaServiceContent = [
  {
    code: 'intensiva',
    title: 'Sesión individual en Sevilla (1h)',
    label: 'Consulta 1 a 1 con Alejandro',
    cardSubtitle: 'Consulta 1 a 1 con Alejandro',
    intro:
      'Evaluación inicial sobre el caso, orientación profesional y sesiones de seguimiento. Total: 75 €.',
    cardDescription:
      'Evaluación inicial sobre el caso, orientación profesional y sesiones de seguimiento. Total: 75 €.',
    description:
      'Una sesión individual de una hora en Sevilla para evaluar tu caso, recibir orientación profesional o realizar seguimiento. Precio: 75 €. Si después contratas el servicio integral, el importe de esta valoración inicial se descuenta del precio final.',
    actionMode: 'calendly',
    actionUrl: 'https://calendly.com/adiestracaninos/sesion-de-seguimiento',
    seoTitle: 'Sesión individual en Sevilla (1h) | El Neurocanino',
    seoDescription:
      'Sesión individual de una hora en Sevilla para valoración, orientación o seguimiento. Reserva tu cita en Calendly.',
  },
  {
    code: 'educacion',
    title: 'Sesión intensiva en Sevilla (3h)',
    label: 'Implementación del sistema (SIC)',
    cardSubtitle: 'Implementación del sistema (SIC)',
    intro:
      'Desbloqueo del comportamiento deseado, formación de perro y familia en el Sistema de Integración Canina, introducción al nuevo hábito y práctica supervisada. Total: 250 €.',
    cardDescription:
      'Desbloqueo del comportamiento deseado, formación de perro y familia en el Sistema de Integración Canina, introducción al nuevo hábito y práctica supervisada. Total: 250 €.',
    description:
      'Una sesión intensiva de tres horas en Sevilla para trabajar el comportamiento deseado, formar al perro y su familia en el Sistema de Integración Canina e introducir nuevos hábitos mediante práctica supervisada. Precio: 250 €. Si después contratas el servicio integral, el importe de esta valoración inicial se descuenta del precio final.',
    actionMode: 'calendly',
    actionUrl: 'https://calendly.com/adiestracaninos/sesion-intensiva',
    seoTitle: 'Sesión intensiva en Sevilla (3h) | El Neurocanino',
    seoDescription:
      'Sesión intensiva de tres horas en Sevilla para trabajar con tu perro y aprender el Sistema de Integración Canina. Reserva en Calendly.',
  },
  {
    code: 'rehabilitacion',
    title: 'Servicio integral',
    label: 'Adiestramiento, Educación y Modificación de Comportamiento',
    cardSubtitle: 'Adiestramiento, Educación y Modificación de Comportamiento',
    intro:
      'Un servicio personalizado de adiestramiento, educación y modificación de comportamiento, adaptado a cada perro y su familia.',
    cardDescription:
      'Servicio completo para conseguir el compañero canino que deseas. Requiere una valoración inicial de 1 o 3 horas, cuyo importe se descuenta del precio final. El precio depende del caso y del tiempo requerido.',
    description:
      'Un proceso personalizado de adiestramiento, educación y modificación de comportamiento. Puedes realizar el proceso completo o asistir solo a las sesiones necesarias. Antes de empezar es necesaria una valoración inicial: puedes elegir la sesión individual de 1 hora o la sesión intensiva de 3 horas. El importe de esta valoración se descuenta del precio final, que depende del caso y del tiempo requerido.',
    actionMode: 'contact',
    actionUrl: null,
    seoTitle: 'Servicio integral de educación canina en Sevilla | El Neurocanino',
    seoDescription:
      'Adiestramiento, educación y modificación de comportamiento en Sevilla, con valoración inicial personalizada.',
  },
  {
    code: 'comunidad',
    title: 'Club de Integración Canina',
    label: 'Comunidad en Skool',
    cardSubtitle: 'Comunidad en Skool',
    intro:
      'La comunidad privada donde familias y profesionales aprenden a comprender el comportamiento canino desde una perspectiva científica y práctica.',
    cardDescription:
      'La comunidad privada donde familias y profesionales aprenden a comprender el comportamiento canino desde una perspectiva científica y práctica.',
    description:
      'Una comunidad privada en Skool para familias y profesionales que quieren comprender el comportamiento canino desde una perspectiva científica y práctica, compartir experiencias y seguir aprendiendo.',
    actionMode: 'external',
    actionUrl: 'https://www.skool.com/elneurocanino',
    seoTitle: 'Club de Integración Canina | El Neurocanino',
    seoDescription:
      'Comunidad privada en Skool para aprender sobre comportamiento canino y compartir experiencias.',
  },
] as const;
