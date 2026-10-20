import { DataSource } from 'typeorm';
import { services } from '../content/catalog';
import { Service, ServiceOutcome, Review, Edition } from './entities';
import { serviceSeoTitles } from '../content/service-seo';
import { serviceCardImages } from '../content/service-card-images';
import { config } from '../config';
export async function seed(db: DataSource) {
  for (const service of services) {
    if (await db.getRepository(Service).findOneBy({ code: service.code })) continue;
    await db.transaction(async (manager) => {
      const { outcomes, ...values } = service;
      const saved = await manager.getRepository(Service).save({
        ...values,
        cardImage: serviceCardImages[service.code] || null,
        actionMode: service.code === 'comunidad' ? 'external' : 'contact',
        actionUrl: service.code === 'comunidad' ? 'https://www.skool.com/elneurocanino' : null,
        seoTitle: serviceSeoTitles[service.code],
        seoDescription: null,
      });
      await manager
        .getRepository(ServiceOutcome)
        .save(outcomes.map((point, sortOrder) => ({ ...point, serviceId: saved.id, sortOrder })));
    });
  }
  if (config.SEED_DEMO !== 'true' || config.APP_ENV === 'production') return;
  if ((await db.getRepository(Review).count()) === 0) {
    const texts = [
      'Ahora observo antes de intervenir. Ese cambio ha transformado mi forma de trabajar.',
      'Encontré un espacio para contrastar mis dudas y revisar mis decisiones con calma.',
      'El trabajo presencial me ayudó a ver detalles que pasaba por alto en las sesiones.',
      'Una forma clara de conectar lo aprendido con las situaciones del día a día.',
      'Volví al trabajo con nuevas preguntas y una mirada mucho más precisa.',
      'La práctica y la conversación con otros profesionales marcaron la diferencia.',
      'Me ayudó a entender mejor el contexto de cada perro y su familia.',
      'Pude revisar un caso concreto y ordenar los siguientes pasos.',
      'Un recorrido que me ha animado a seguir aprendiendo y compartiendo.',
      'Lo más valioso fue aprender a detenerme, observar y escuchar.',
    ];
    await db.getRepository(Review).save(
      texts.map((text, i) => ({
        author: `Profesional ${String(i + 1).padStart(2, '0')}`,
        text,
        rating: 5,
        sortOrder: i,
        isDemo: true,
        published: true,
        date: null,
        sourceUrl: null,
      })),
    );
  }
  if ((await db.getRepository(Edition).count()) === 0) {
    const date = (months: number) => {
      const d = new Date();
      d.setUTCMonth(d.getUTCMonth() + months);
      return d.toISOString().slice(0, 10);
    };
    await db.getRepository(Edition).save(
      [1, 2, 3].map((n) => ({
        title: `Práctica de integración canina · ${['Sevilla', 'Madrid', 'Valencia'][n - 1]}`,
        city: ['Sevilla', 'Madrid', 'Valencia'][n - 1],
        province: ['Sevilla', 'Madrid', 'Valencia'][n - 1],
        location: 'Localización por confirmar',
        startDate: date(n),
        endDate: date(n),
        description:
          'Convocatoria de demostración. Un encuentro de observación, práctica y revisión de casos en grupo reducido.',
        capacity: 12,
        placesAvailable: n === 3 ? 0 : 8 - n,
        photos: [
          '/images/photos/adiestramiento-canino-en-campo.jpg',
          '/images/photos/formacion-canina-practica.jpg',
        ],
        calendlyUrl: null,
        published: true,
        isDemo: true,
      })),
    );
  }
}
