import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  completeCardSubtitle20261105,
  serviceContent20261105,
} from '../content/service-content-20261105';

export class ServiceContentSync1793186000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    for (const service of serviceContent20261105) {
      await q.query(
        'UPDATE services SET title = ?, label = ?, intro = ?, description = ?, card_subtitle = ?, card_description = ?, seo_title = ?, seo_description = ? WHERE code = ?',
        [
          service.title,
          service.label,
          service.intro,
          service.description,
          service.cardSubtitle,
          service.cardDescription,
          service.seoTitle,
          service.seoDescription,
          service.code,
        ],
      );
    }
    await q.query('UPDATE commercial_offers SET card_subtitle = ? WHERE code = ?', [
      completeCardSubtitle20261105,
      'online-presencial',
    ]);
  }

  async down() {
    // Editorial content can have been changed since deployment; restore it from backup if needed.
  }
}
