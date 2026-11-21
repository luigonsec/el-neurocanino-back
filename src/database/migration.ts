import { MigrationInterface, QueryRunner } from 'typeorm';

// Reuse authentication and media from the legacy schema. Keep old intake tables available for rollback.
export class InitialSchema1795219200000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(
      `CREATE TABLE IF NOT EXISTS administrators (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE IF NOT EXISTS sessions (id INT AUTO_INCREMENT PRIMARY KEY, token_hash VARCHAR(64) NOT NULL UNIQUE, admin_id INT NOT NULL, csrf_token VARCHAR(64) NOT NULL, expires_at DATETIME NOT NULL, FOREIGN KEY(admin_id) REFERENCES administrators(id) ON DELETE CASCADE) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE IF NOT EXISTS booking_links (code VARCHAR(30) PRIMARY KEY, url VARCHAR(500) NOT NULL, updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE IF NOT EXISTS program_leads (id VARCHAR(36) PRIMARY KEY, submissionHash VARCHAR(64) NOT NULL UNIQUE, requestHash VARCHAR(64) NOT NULL, category VARCHAR(20) NOT NULL, name VARCHAR(120) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(40) NULL, city VARCHAR(255) NULL, message TEXT NULL, answers JSON NULL, outcome VARCHAR(20) NULL, status VARCHAR(20) NOT NULL DEFAULT 'new', privacyVersion VARCHAR(30) NOT NULL, createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX(category,createdAt)) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE IF NOT EXISTS events (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT NOT NULL, location VARCHAR(255) NOT NULL, city VARCHAR(255) NOT NULL, startDate DATE NOT NULL, endDate DATE NOT NULL, image VARCHAR(255) NULL, capacity INT NOT NULL, published BOOLEAN NOT NULL DEFAULT FALSE, status VARCHAR(20) NOT NULL DEFAULT 'open', updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), CONSTRAINT event_capacity CHECK(capacity > 0), CONSTRAINT event_dates CHECK(endDate >= startDate)) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE IF NOT EXISTS event_registrations (id VARCHAR(36) PRIMARY KEY, eventId INT NOT NULL, submissionHash VARCHAR(64) NOT NULL UNIQUE, requestHash VARCHAR(64) NOT NULL, name VARCHAR(120) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(40) NOT NULL, comment TEXT NULL, privacyVersion VARCHAR(30) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending', revision INT NOT NULL DEFAULT 0, createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE(eventId,email), FOREIGN KEY(eventId) REFERENCES events(id)) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE IF NOT EXISTS media (id VARCHAR(36) PRIMARY KEY, path VARCHAR(255) NOT NULL, original_name VARCHAR(255) NOT NULL, width INT NOT NULL, height INT NOT NULL, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE IF NOT EXISTS program_deliveries (id INT AUTO_INCREMENT PRIMARY KEY, dedupeKey VARCHAR(150) NOT NULL UNIQUE, leadId VARCHAR(36) NULL, registrationId VARCHAR(36) NULL, recipient VARCHAR(255) NULL, subject VARCHAR(255) NOT NULL, text TEXT NOT NULL, html MEDIUMTEXT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending', attempts INT NOT NULL DEFAULT 0, nextAttemptAt DATETIME NOT NULL, lastError TEXT NULL, INDEX(status,nextAttemptAt), FOREIGN KEY(leadId) REFERENCES program_leads(id) ON DELETE CASCADE, FOREIGN KEY(registrationId) REFERENCES event_registrations(id) ON DELETE CASCADE) ENGINE=InnoDB`,
    );
  }
  async down() {
    throw new Error('Conserva los datos y revierte la imagen del backend en lugar del esquema.');
  }
}

// Existing installations of the new schema already recorded InitialSchema with the original table names.
export class SeparateProgramIntake1795219300000 implements MigrationInterface {
  async up(q: QueryRunner) {
    const migrations = [
      { from: 'leads', to: 'program_leads', column: 'submissionHash' },
      { from: 'deliveries', to: 'program_deliveries', column: 'dedupeKey' },
    ];
    const renames: string[] = [];
    for (const { from, to, column } of migrations) {
      const targetExists = await q.hasTable(to);
      if (await q.hasColumn(from, column)) {
        if (targetExists)
          throw new Error(`Existen dos tablas de solicitudes o correos: ${from} y ${to}.`);
        renames.push(`\`${from}\` TO \`${to}\``);
      } else if (!targetExists) {
        throw new Error(`No se encontró la tabla requerida ${to}.`);
      }
    }
    if (renames.length) await q.query('RENAME TABLE ' + renames.join(', '));
  }

  async down() {
    throw new Error('Conserva los datos. Esta migración solo se aplica hacia delante.');
  }
}
