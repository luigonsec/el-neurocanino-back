import { MigrationInterface, QueryRunner } from 'typeorm';
import { calendlyServiceCodes, sevillaServiceContent } from '../content/sevilla-services';

export class SevillaServices1793272000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    for (const service of sevillaServiceContent) {
      await q.query(
        'UPDATE services SET title=?, label=?, intro=?, description=?, card_subtitle=?, card_description=?, action_mode=?, action_url=?, seo_title=?, seo_description=? WHERE code=?',
        [
          service.title,
          service.label,
          service.intro,
          service.description,
          service.cardSubtitle,
          service.cardDescription,
          service.actionMode,
          service.actionUrl,
          service.seoTitle,
          service.seoDescription,
          service.code,
        ],
      );
    }
    // Preserve existing payment configuration and history, but stop publishing these offers.
    await q.query('UPDATE commercial_offers SET published=0 WHERE code IN (?, ?, ?)', [
      ...calendlyServiceCodes,
    ]);
  }

  async down() {
    throw new Error('Restaurar la copia previa para revertir los cambios de servicios.');
  }
}
