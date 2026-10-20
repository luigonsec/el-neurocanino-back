import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommunitySkool1792510000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query('UPDATE services SET action_mode = ?, action_url = ? WHERE code = ?', [
      'external',
      'https://www.skool.com/elneurocanino',
      'comunidad',
    ]);
  }

  async down(q: QueryRunner) {
    await q.query(
      'UPDATE services SET action_mode = ?, action_url = NULL WHERE code = ? AND action_mode = ? AND action_url = ?',
      ['contact', 'comunidad', 'external', 'https://www.skool.com/elneurocanino'],
    );
  }
}
