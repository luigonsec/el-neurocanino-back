export const oldBase = '/servicios-adiestramiento-educacion-canina-sevilla';
export const services = [
  {
    code: 'comunidad',
    route: '/servicios/comunidad/',
    title: 'Comunidad',
    label: 'El trabajo continúa',
    intro: 'Un espacio para compartir criterio, preguntas y evolución con otros profesionales.',
    description:
      'El aprendizaje no termina al cerrar una sesión. Una comunidad permite contrastar experiencias, revisar casos y sostener una forma de trabajar consciente.',
    outcomes: [
      { title: 'Intercambio entre profesionales', description: '' },
      { title: 'Perspectiva sobre casos reales', description: '' },
      { title: 'Acompañamiento continuado', description: '' },
    ],
    image: '/images/banners/banner-empieza-aqui-llave-huella.jpeg',
  },
  {
    code: 'online',
    route: '/servicios/programa-online/',
    title: 'Programa Online',
    label: 'Aprende desde donde trabajas',
    intro: 'Formación para observar mejor, comprender lo que ocurre y llevarlo a tu práctica.',
    description:
      'Formación a distancia alojada en Skool para integrar la metodología en tu práctica. Puedes contratar el Programa Online de forma independiente o combinarlo con la Comunidad o una edición presencial.',
    outcomes: [
      { title: 'Formación desde tu propio entorno', description: '' },
      { title: 'Aplicación a tu práctica diaria', description: '' },
      { title: 'Un recorrido de aprendizaje estructurado', description: '' },
    ],
    image: '/images/photos/adiestramiento-canino-en-campo.jpg',
  },
  {
    code: 'presencial',
    route: '/servicios/programa-presencial/',
    title: 'Programa presencial de 4 días',
    label: 'El criterio se entrena en campo',
    intro: 'Observación, práctica y conversación. Trabajar cerca cambia la forma de aprender.',
    description:
      'Ediciones presenciales en grupos reducidos para profundizar en la relación humano–perro y la Metodología de Integración Canina. Consulta las próximas convocatorias o propón una edición en tu zona.',
    outcomes: [
      { title: 'Práctica en grupos reducidos', description: '' },
      { title: 'Trabajo sobre situaciones reales', description: '' },
      { title: 'Observación y devolución directa', description: '' },
    ],
    image: '/images/photos/adiestramiento-canino-en-campo.jpg',
  },
  {
    code: 'intensiva',
    route: '/servicios/sesion-intensiva/',
    title: 'Sesión Intensiva en Sevilla',
    label: 'Una mirada sobre tu caso',
    intro: 'Un encuentro enfocado para revisar una situación y decidir cómo continuar.',
    description:
      'Una sesión individual de tres horas en Sevilla para revisar un caso, trabajar sobre una situación concreta y ordenar los siguientes pasos. La reserva y el pago se realizan mediante Calendly.',
    outcomes: [
      { title: 'Atención a una situación concreta', description: '' },
      { title: 'Revisión de tu planteamiento', description: '' },
      { title: 'Orientación sobre los siguientes pasos', description: '' },
    ],
    image: '/images/photos/perro-pastor-aleman.jpg',
  },
  {
    code: 'educacion',
    route: `${oldBase}/adiestramiento-canino-funcional-y-educacion-canina-integral/`,
    title: 'Adiestramiento y educación',
    label: 'Convivencia que tiene sentido',
    intro:
      'Educación canina integral y adiestramiento funcional en Sevilla, en el entorno de cada familia.',
    description:
      'Comprender al perro y las necesidades de su familia es el punto de partida. Trabajamos sobre la convivencia, los paseos y las situaciones cotidianas, con implicación de las personas que acompañan al perro.',
    outcomes: [
      { title: 'Educación para la vida cotidiana', description: '' },
      { title: 'Trabajo en el entorno del perro', description: '' },
      { title: 'Implicación de la familia', description: '' },
    ],
    image: '/images/photos/perro-pastor-aleman.jpg',
  },
  {
    code: 'rehabilitacion',
    route: `${oldBase}/rehabilitacion-canina-problemas-conducta/`,
    title: 'Modificación de Comportamiento',
    label: 'Comprender antes de intervenir',
    intro:
      'Trabajo personalizado sobre problemas de comportamiento y alteraciones emocionales en Sevilla.',
    description:
      'Reactividad, miedo, ansiedad y dificultades de convivencia necesitan una mirada individual. La valoración inicial permite comprender la situación, el entorno y las necesidades del perro y de las personas con las que vive.',
    outcomes: [
      { title: 'Valoración de cada situación', description: '' },
      { title: 'Trabajo sobre el entorno y la relación', description: '' },
      { title: 'Acompañamiento de la familia', description: '' },
    ],
    image: '/images/photos/perro-pastor-aleman.jpg',
  },
] as const;
export type ServiceCode = (typeof services)[number]['code'];
export type ActionMode = 'contact' | 'external' | 'calendly';
