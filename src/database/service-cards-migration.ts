import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceCards1792171000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query('ALTER TABLE services ADD card_image VARCHAR(255) NULL');
    const images: Record<string, string> = {
      comunidad: '/images/icons/club-integracion-canina.webp',
      online: '/images/icons/programa-online.webp',
      presencial: '/images/icons/programa-presencial.webp',
      intensiva: '/images/icons/sesion-intensiva-sevilla.webp',
      educacion: '/images/icons/adiestramiento-educacion-canina.webp',
      rehabilitacion: '/images/icons/rehabilitacion-modificacion-comportamiento.webp',
    };
    for (const [code, image] of Object.entries(images)) {
      await q.query('UPDATE services SET card_image = ? WHERE code = ?', [image, code]);
    }
  }
  async down(q: QueryRunner) {
    await q.query('ALTER TABLE services DROP COLUMN card_image');
  }
}
