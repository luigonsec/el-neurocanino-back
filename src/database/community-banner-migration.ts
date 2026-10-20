import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommunityBanner1792511000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query('UPDATE services SET image = ? WHERE code = ?', [
      '/images/banners/banner-empieza-aqui-llave-huella.jpeg',
      'comunidad',
    ]);
  }
  async down(q: QueryRunner) {
    await q.query('UPDATE services SET image = ? WHERE code = ? AND image = ?', [
      '/images/photos/grupo-club-integracion-canina.webp',
      'comunidad',
      '/images/banners/banner-empieza-aqui-llave-huella.jpeg',
    ]);
  }
}
