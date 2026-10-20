import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceOutcomes1792172000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`CREATE TABLE service_outcomes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      INDEX(service_id, sort_order),
      FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    const services: { id: number; outcomes: string | string[] }[] = await q.query(
      'SELECT id, outcomes FROM services ORDER BY id',
    );
    for (const service of services) {
      const outcomes: string[] =
        typeof service.outcomes === 'string' ? JSON.parse(service.outcomes) : service.outcomes;
      for (const [index, title] of outcomes.entries()) {
        if (typeof title !== 'string')
          throw new Error('Formato de puntos de recorrido inesperado.');
        await q.query(
          'INSERT INTO service_outcomes (service_id, title, description, sort_order) VALUES (?, ?, ?, ?)',
          [service.id, title, '', index],
        );
      }
    }
    await q.query('ALTER TABLE services DROP COLUMN outcomes');
  }
  async down(q: QueryRunner) {
    await q.query('ALTER TABLE services ADD outcomes JSON NULL');
    const services: { id: number }[] = await q.query('SELECT id FROM services');
    for (const service of services) {
      const points: { title: string }[] = await q.query(
        'SELECT title FROM service_outcomes WHERE service_id = ? ORDER BY sort_order, id',
        [service.id],
      );
      await q.query('UPDATE services SET outcomes = ? WHERE id = ?', [
        JSON.stringify(points.map((point) => point.title)),
        service.id,
      ]);
    }
    await q.query('ALTER TABLE services MODIFY outcomes JSON NOT NULL');
    await q.query('DROP TABLE service_outcomes');
  }
}
