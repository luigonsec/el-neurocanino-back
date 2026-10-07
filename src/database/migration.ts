import { MigrationInterface, QueryRunner } from 'typeorm';
export class InitialSchema1791320000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(
      `CREATE TABLE services (id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(40) NOT NULL UNIQUE, route VARCHAR(255) NOT NULL UNIQUE, title VARCHAR(255) NOT NULL, label VARCHAR(255) NOT NULL, intro TEXT NOT NULL, description TEXT NOT NULL, outcomes JSON NOT NULL, image VARCHAR(255) NOT NULL, action_mode VARCHAR(20) NOT NULL DEFAULT 'contact', action_url VARCHAR(500) NULL, seo_title VARCHAR(255) NULL, seo_description TEXT NULL, updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE editions (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, location VARCHAR(255) NOT NULL, city VARCHAR(255) NOT NULL, province VARCHAR(255) NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, description TEXT NOT NULL, capacity INT NOT NULL, places_available INT NOT NULL, photos JSON NOT NULL, calendly_url VARCHAR(500) NULL, published BOOLEAN NOT NULL DEFAULT FALSE, is_demo BOOLEAN NOT NULL DEFAULT FALSE, updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), CONSTRAINT edition_capacity CHECK(capacity > 0 AND places_available BETWEEN 0 AND capacity), CONSTRAINT edition_dates CHECK(end_date >= start_date)) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE reviews (id INT AUTO_INCREMENT PRIMARY KEY, author VARCHAR(255) NOT NULL, text TEXT NOT NULL, rating INT NOT NULL, date DATE NULL, source_url VARCHAR(500) NULL, sort_order INT NOT NULL DEFAULT 0, published BOOLEAN NOT NULL DEFAULT FALSE, is_demo BOOLEAN NOT NULL DEFAULT FALSE, CONSTRAINT review_rating CHECK(rating BETWEEN 1 AND 5)) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE leads (id VARCHAR(36) PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(40) NULL, city VARCHAR(255) NULL, province VARCHAR(255) NULL, message TEXT NOT NULL, kind VARCHAR(30) NOT NULL, source VARCHAR(100) NOT NULL, service_code VARCHAR(40) NULL, edition_id INT NULL, suggested_dates VARCHAR(255) NULL, interested_count INT NULL, quiz_context JSON NULL, privacy_version VARCHAR(30) NOT NULL, status VARCHAR(30) NOT NULL DEFAULT 'new', created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX(created_at), FOREIGN KEY(service_code) REFERENCES services(code), FOREIGN KEY(edition_id) REFERENCES editions(id) ON DELETE SET NULL) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE administrators (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE sessions (id INT AUTO_INCREMENT PRIMARY KEY, token_hash VARCHAR(64) NOT NULL UNIQUE, admin_id INT NOT NULL, csrf_token VARCHAR(64) NOT NULL, expires_at DATETIME NOT NULL, FOREIGN KEY(admin_id) REFERENCES administrators(id) ON DELETE CASCADE) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE media (id VARCHAR(36) PRIMARY KEY, path VARCHAR(255) NOT NULL, original_name VARCHAR(255) NOT NULL, width INT NOT NULL, height INT NOT NULL, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE deliveries (id INT AUTO_INCREMENT PRIMARY KEY, lead_id VARCHAR(36) NOT NULL, channel VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending', attempts INT NOT NULL DEFAULT 0, next_attempt_at DATETIME NOT NULL, last_error TEXT NULL, INDEX(status,next_attempt_at), FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE) ENGINE=InnoDB`,
    );
  }
  async down(q: QueryRunner) {
    for (const t of [
      'deliveries',
      'media',
      'sessions',
      'administrators',
      'leads',
      'reviews',
      'editions',
      'services',
    ])
      await q.query(`DROP TABLE ${t}`);
  }
}
