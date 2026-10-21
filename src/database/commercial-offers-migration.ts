import { MigrationInterface, QueryRunner } from 'typeorm';
import { seedCommerce } from './commerce-seed';

export class CommercialOffers1792520000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(
      `CREATE TABLE commercial_offers (id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(60) NOT NULL UNIQUE, title VARCHAR(255) NOT NULL, description TEXT NOT NULL, route VARCHAR(255) NULL UNIQUE, booking_url VARCHAR(500) NULL, seo_title VARCHAR(255) NULL, seo_description TEXT NULL, provisional BOOLEAN NOT NULL DEFAULT FALSE, published BOOLEAN NOT NULL DEFAULT TRUE, klarna_enabled BOOLEAN NOT NULL DEFAULT FALSE) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE offer_services (offer_id INT NOT NULL, service_id INT NOT NULL, PRIMARY KEY(offer_id, service_id), FOREIGN KEY(offer_id) REFERENCES commercial_offers(id) ON DELETE CASCADE, FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE CASCADE) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE payment_options (id INT AUTO_INCREMENT PRIMARY KEY, offer_id INT NOT NULL, label VARCHAR(255) NOT NULL, method VARCHAR(20) NOT NULL, currency CHAR(3) NOT NULL DEFAULT 'EUR', amount_cents INT NOT NULL, installment_count INT NOT NULL DEFAULT 1, deposit_cents INT NOT NULL DEFAULT 0, payment_url VARCHAR(500) NULL, transfer_instructions TEXT NULL, whatsapp_url VARCHAR(500) NULL, sort_order INT NOT NULL DEFAULT 0, CONSTRAINT payment_amount CHECK(amount_cents > 0 AND installment_count BETWEEN 1 AND 60 AND deposit_cents >= 0), FOREIGN KEY(offer_id) REFERENCES commercial_offers(id) ON DELETE CASCADE) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE edition_payment_links (id INT AUTO_INCREMENT PRIMARY KEY, edition_id INT NOT NULL, payment_option_id INT NOT NULL, url VARCHAR(500) NOT NULL, UNIQUE(edition_id, payment_option_id), FOREIGN KEY(edition_id) REFERENCES editions(id) ON DELETE CASCADE, FOREIGN KEY(payment_option_id) REFERENCES payment_options(id) ON DELETE CASCADE) ENGINE=InnoDB`,
    );
    // Change only the requested names and known placeholder copy; preserve media and custom edits.
    await q.query(
      `UPDATE services SET title = 'Modificación de Comportamiento', seo_title = 'Modificación de comportamiento canino en Sevilla | El Neurocanino' WHERE code = 'rehabilitacion'`,
    );
    await q.query(
      `UPDATE services SET title = 'Sesión Intensiva en Sevilla' WHERE code = 'intensiva'`,
    );
    await q.query(`UPDATE services SET description = ? WHERE code = 'online' AND description = ?`, [
      'Formación a distancia alojada en Skool para integrar la metodología en tu práctica. Puedes contratar el Programa Online de forma independiente o combinarlo con la Comunidad o una edición presencial.',
      'Una propuesta de formación a distancia para integrar la metodología en tu trabajo diario. El contenido, el calendario y las condiciones definitivas se anunciarán próximamente.',
    ]);
    await q.query(
      `UPDATE services SET description = ? WHERE code = 'intensiva' AND description = ?`,
      [
        'Una sesión individual de tres horas en Sevilla para revisar un caso, trabajar sobre una situación concreta y ordenar los siguientes pasos. La reserva y el pago se realizan mediante Calendly.',
        'Un espacio de trabajo individual para profesionales que necesitan profundizar en un caso, revisar su planteamiento o aclarar una intervención. El formato definitivo se concretará al solicitar información.',
      ],
    );
    await seedCommerce(q.manager);
  }
  async down(q: QueryRunner) {
    for (const table of [
      'edition_payment_links',
      'payment_options',
      'offer_services',
      'commercial_offers',
    ])
      await q.query(`DROP TABLE ${table}`);
  }
}
