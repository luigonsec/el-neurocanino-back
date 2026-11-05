import { MigrationInterface, QueryRunner } from 'typeorm';
import { completeProgramCardSubtitle, onlineCard } from '../content/landing-cards';

export class LandingCards1793185000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(
      'ALTER TABLE services ADD card_subtitle VARCHAR(255) NULL, ADD card_description TEXT NULL',
    );
    await q.query('ALTER TABLE commercial_offers ADD card_subtitle VARCHAR(255) NULL');
    await q.query('UPDATE services SET card_subtitle = label');
    await q.query('UPDATE services SET card_subtitle = ?, card_description = ? WHERE code = ?', [
      onlineCard.subtitle,
      onlineCard.description,
      'online',
    ]);
    await q.query('UPDATE commercial_offers SET card_subtitle = ? WHERE code = ?', [
      completeProgramCardSubtitle,
      'online-presencial',
    ]);
  }

  async down(q: QueryRunner) {
    await q.query('ALTER TABLE commercial_offers DROP COLUMN card_subtitle');
    await q.query('ALTER TABLE services DROP COLUMN card_description, DROP COLUMN card_subtitle');
  }
}
