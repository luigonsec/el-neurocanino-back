import { MigrationInterface, QueryRunner } from 'typeorm';
import { confirmedBookings } from '../content/booking-defaults';
export class ConfirmedCalendars1793181000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    for (const [code, url] of Object.entries(confirmedBookings))
      await q.query('UPDATE commercial_offers SET booking_url = ? WHERE code = ?', [url, code]);
  }
  async down(q: QueryRunner) {
    for (const [code, url] of Object.entries(confirmedBookings))
      await q.query(
        'UPDATE commercial_offers SET booking_url = NULL WHERE code = ? AND booking_url = ?',
        [code, url],
      );
  }
}
