import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReviewPhotos1792830000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(
      'ALTER TABLE reviews ADD photo_path VARCHAR(255) NULL, ADD author_url VARCHAR(500) NULL',
    );
  }

  async down(q: QueryRunner) {
    await q.query('ALTER TABLE reviews DROP COLUMN author_url, DROP COLUMN photo_path');
  }
}
