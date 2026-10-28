import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  programPresentation20261028,
  servicePresentation20261028,
} from '../content/program-presentation-20261028';
import { programs20261028, servicePrograms20261028 } from '../content/programs-20261028';

export class ProgramPresentation1793182000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    for (const p of programPresentation20261028) {
      await q.query(
        'UPDATE commercial_offers SET title = ?, description = ?, seo_title = ?, seo_description = ? WHERE code = ?',
        [p.title, p.description, p.seoTitle, p.seoDescription, p.code],
      );
    }
    for (const p of servicePresentation20261028) {
      await q.query(
        'UPDATE services SET title = ?, label = ?, intro = ?, description = ?, seo_title = ?, seo_description = ? WHERE code = ?',
        [p.title, p.label, p.intro, p.description, p.seoTitle, p.seoDescription, p.code],
      );
    }
  }
  async down(q: QueryRunner) {
    for (const p of programs20261028) {
      const seo = 'seoTitle' in p ? p : null;
      await q.query(
        'UPDATE commercial_offers SET title = ?, description = ?, seo_title = ?, seo_description = ? WHERE code = ?',
        [p.title, p.description, seo?.seoTitle || null, seo?.seoDescription || null, p.code],
      );
    }
    for (const p of servicePrograms20261028) {
      await q.query(
        'UPDATE services SET title = ?, label = ?, intro = ?, description = ?, seo_title = ?, seo_description = ? WHERE code = ?',
        [p.title, p.label, p.intro, p.description, p.seoTitle, p.seoDescription, p.code],
      );
    }
  }
}
