import { MigrationInterface, QueryRunner } from 'typeorm';
export class QuizLeads1792601000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(
      'ALTER TABLE leads MODIFY email VARCHAR(255) NULL, ADD quiz_token_hash VARCHAR(64) NULL UNIQUE',
    );
  }
  async down(q: QueryRunner) {
    if ((await q.query('SELECT id FROM leads WHERE email IS NULL LIMIT 1')).length)
      throw new Error(
        'Hay solicitudes sin email; conserva o exporta estos datos antes de revertir.',
      );
    await q.query(
      'ALTER TABLE leads DROP COLUMN quiz_token_hash, MODIFY email VARCHAR(255) NOT NULL',
    );
  }
}
