import { MigrationInterface, QueryRunner } from 'typeorm';
import { serviceSeoTitles } from '../content/service-seo';

export class AdminImprovements1791420000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query("ALTER TABLE editions ADD status VARCHAR(20) NOT NULL DEFAULT 'open'");
    for (const [code, title] of Object.entries(serviceSeoTitles)) {
      await q.query(
        "UPDATE services SET seo_title = ? WHERE code = ? AND (seo_title IS NULL OR TRIM(seo_title) = '')",
        [title, code],
      );
    }
  }
  async down(q: QueryRunner) {
    await q.query('ALTER TABLE editions DROP COLUMN status');
    for (const [code, title] of Object.entries(serviceSeoTitles)) {
      await q.query('UPDATE services SET seo_title = NULL WHERE code = ? AND seo_title = ?', [
        code,
        title,
      ]);
    }
  }
}
