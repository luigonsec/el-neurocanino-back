import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenamePresencial1792170000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query('UPDATE services SET title = ? WHERE code = ?', [
      'Programa presencial de 4 días',
      'presencial',
    ]);
  }

  async down(q: QueryRunner) {
    await q.query('UPDATE services SET title = ? WHERE code = ? AND title = ?', [
      'Programa Presencial',
      'presencial',
      'Programa presencial de 4 días',
    ]);
  }
}
