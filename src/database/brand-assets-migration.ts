import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClubBrandAssets1791381600000 implements MigrationInterface {
  async up(q: QueryRunner) {
    // Only replace the original placeholder; preserve images selected in the panel.
    await q.query('UPDATE services SET image = ? WHERE code = ? AND image = ?', [
      '/images/branding/grupo-profesionales-perros-club-integracion-canina.webp',
      'comunidad',
      '/images/community.jpg',
    ]);
  }

  async down(q: QueryRunner) {
    await q.query('UPDATE services SET image = ? WHERE code = ? AND image = ?', [
      '/images/community.jpg',
      'comunidad',
      '/images/branding/grupo-profesionales-perros-club-integracion-canina.webp',
    ]);
  }
}
