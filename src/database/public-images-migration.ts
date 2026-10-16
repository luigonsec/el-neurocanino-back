import { MigrationInterface, QueryRunner } from 'typeorm';

// Same assets, new folders. Match complete paths and preserve uploaded/custom media.
const imagePaths = {
  '/images/training.jpg': '/images/photos/adiestramiento-canino-en-campo.jpg',
  '/images/community.jpg': '/images/photos/formacion-canina-practica.jpg',
  '/images/dog.jpg': '/images/photos/perro-pastor-aleman.jpg',
  '/images/branding/grupo-profesionales-perros-club-integracion-canina.webp':
    '/images/photos/grupo-club-integracion-canina.webp',
  '/images/branding/icono-comunidad-personas-perros.webp':
    '/images/icons/club-integracion-canina.webp',
  '/images/branding/icono-formacion-online-libro-portatil-01.webp':
    '/images/icons/programa-online.webp',
  '/images/branding/icono-educacion-persona-paseando-perro.webp':
    '/images/icons/programa-presencial.webp',
  '/images/branding/icono-sesion-intensiva-sevilla.webp':
    '/images/icons/sesion-intensiva-sevilla.webp',
  '/images/branding/icono-adiestramiento-educacion-canina.webp':
    '/images/icons/adiestramiento-educacion-canina.webp',
  '/images/branding/icono-rehabilitacion-modificacion-comportamiento.webp':
    '/images/icons/rehabilitacion-modificacion-comportamiento.webp',
  '/images/branding/icono-metodologia-perro-cubo.webp':
    '/images/icons/metodologia-integracion-canina.webp',
  '/images/branding/banner-biblioteca-club-perro-libro.webp':
    '/images/banners/biblioteca-club-integracion-canina.webp',
  '/images/branding/banner-directo-semanal-microfono-01.webp':
    '/images/banners/directo-semanal-club-integracion-canina.webp',
} as const;

export class OrganizePublicImages1791410000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await this.remap(q, Object.entries(imagePaths));
  }

  async down(q: QueryRunner) {
    await this.remap(
      q,
      Object.entries(imagePaths).map(([from, to]) => [to, from]),
    );
  }

  private async remap(q: QueryRunner, pairs: [string, string][]) {
    const paths = new Map(pairs);
    for (const [from, to] of pairs) {
      await q.query('UPDATE services SET image = ? WHERE image = ?', [to, from]);
    }
    const editions: { id: number; photos: string | string[] }[] = await q.query(
      'SELECT id, photos FROM editions',
    );
    for (const edition of editions) {
      const photos: string[] =
        typeof edition.photos === 'string' ? JSON.parse(edition.photos) : edition.photos;
      const updated = photos.map((photo) => paths.get(photo) || photo);
      if (updated.some((photo, index) => photo !== photos[index])) {
        await q.query('UPDATE editions SET photos = ? WHERE id = ?', [
          JSON.stringify(updated),
          edition.id,
        ]);
      }
    }
  }
}
