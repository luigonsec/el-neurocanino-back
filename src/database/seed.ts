import { DataSource } from 'typeorm';
import { BookingLink } from './entities';
import { bookingDefaults } from '../bookings/bookings';
export async function seed(db: DataSource) {
  await db
    .getRepository(BookingLink)
    .createQueryBuilder()
    .insert()
    .values(Object.entries(bookingDefaults).map(([code, url]) => ({ code, url })))
    .orIgnore()
    .execute();
}
