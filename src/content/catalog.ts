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
      'Intercambio entre profesionales',
      'Perspectiva sobre casos reales',
      'Acompañamiento continuado',
    ],
    image: '/images/branding/grupo-profesionales-perros-club-integracion-canina.webp',
  },
  {
    code: 'online',
    route: '/servicios/programa-online/',
    title: 'Programa Online',
    label: 'Aprende desde donde trabajas',
    intro: 'Formación para observar mejor, comprender lo que ocurre y llevarlo a tu práctica.',
    description:
      'Una propuesta de formación a distancia para integrar la metodología en tu trabajo diario. El contenido, el calendario y las condiciones definitivas se anunciarán próximamente.',
    outcomes: [
      'Formación desde tu propio entorno',
      'Aplicación a tu práctica diaria',
      'Un recorrido de aprendizaje estructurado',
    ],
    image: '/images/training.jpg',
  },
  {
    code: 'presencial',
    route: '/servicios/programa-presencial/',
    title: 'Programa Presencial',
    label: 'El criterio se entrena en campo',
    intro: 'Observación, práctica y conversación. Trabajar cerca cambia la forma de aprender.',
    description:
      'Ediciones presenciales en grupos reducidos para profundizar en la relación humano–perro y la Metodología de Integración Canina. Consulta las próximas convocatorias o propón una edición en tu zona.',
    outcomes: [
      'Práctica en grupos reducidos',
      'Trabajo sobre situaciones reales',
      'Observación y devolución directa',
    ],
    image: '/images/training.jpg',
  },
  {
    code: 'intensiva',
    route: '/servicios/sesion-intensiva/',
    title: 'Sesión Intensiva',
    label: 'Una mirada sobre tu caso',
    intro: 'Un encuentro enfocado para revisar una situación y decidir cómo continuar.',
    description:
      'Un espacio de trabajo individual para profesionales que necesitan profundizar en un caso, revisar su planteamiento o aclarar una intervención. El formato definitivo se concretará al solicitar información.',
    outcomes: [
      'Atención a una situación concreta',
      'Revisión de tu planteamiento',
      'Orientación sobre los siguientes pasos',
    ],
    image: '/images/dog.jpg',
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
      'Educación para la vida cotidiana',
      'Trabajo en el entorno del perro',
      'Implicación de la familia',
    ],
    image: '/images/dog.jpg',
  },
  {
    code: 'rehabilitacion',
    route: `${oldBase}/rehabilitacion-canina-problemas-conducta/`,
    title: 'Modificación de comportamiento + rehabilitación',
    label: 'Comprender antes de intervenir',
    intro:
      'Trabajo personalizado sobre problemas de comportamiento y alteraciones emocionales en Sevilla.',
    description:
      'Reactividad, miedo, ansiedad y dificultades de convivencia necesitan una mirada individual. La valoración inicial permite comprender la situación, el entorno y las necesidades del perro y de las personas con las que vive.',
    outcomes: [
      'Valoración de cada situación',
      'Trabajo sobre el entorno y la relación',
      'Acompañamiento de la familia',
    ],
    image: '/images/dog.jpg',
  },
] as const;
export type ServiceCode = (typeof services)[number]['code'];
export type ActionMode = 'contact' | 'external' | 'calendly';
