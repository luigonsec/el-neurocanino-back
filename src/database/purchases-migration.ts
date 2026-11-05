import { MigrationInterface, QueryRunner } from 'typeorm';
export class Purchases1793184000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(
      `CREATE TABLE purchase_orders (id VARCHAR(36) PRIMARY KEY, request_key VARCHAR(36) NOT NULL UNIQUE, public_token CHAR(64) NOT NULL UNIQUE, snapshot JSON NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'pending', billing_status VARCHAR(24) NOT NULL DEFAULT 'none', amount_paid INT NOT NULL DEFAULT 0, paid_installments INT NOT NULL DEFAULT 0, is_test BOOLEAN NOT NULL DEFAULT TRUE, email VARCHAR(255) NULL, name VARCHAR(255) NULL, phone VARCHAR(40) NULL, subscription_id VARCHAR(255) NULL UNIQUE, schedule_id VARCHAR(255) NULL, lead_id VARCHAR(36) NULL, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE purchase_attempts (id VARCHAR(36) PRIMARY KEY, order_id VARCHAR(36) NOT NULL, session_id VARCHAR(255) NULL UNIQUE, url TEXT NULL, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX(order_id), FOREIGN KEY(order_id) REFERENCES purchase_orders(id)) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE stripe_event_inbox (id VARCHAR(255) PRIMARY KEY, payload JSON NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending', attempts INT NOT NULL DEFAULT 0, next_attempt_at DATETIME NOT NULL, last_error TEXT NULL, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE purchase_receipts (id VARCHAR(255) PRIMARY KEY, order_id VARCHAR(36) NOT NULL, amount INT NOT NULL, is_installment BOOLEAN NOT NULL DEFAULT FALSE, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX(order_id), FOREIGN KEY(order_id) REFERENCES purchase_orders(id)) ENGINE=InnoDB`,
    );
    await q.query(
      `CREATE TABLE stripe_catalog_bindings (fingerprint VARCHAR(120) PRIMARY KEY, price_id VARCHAR(255) NOT NULL, product_id VARCHAR(255) NOT NULL, account_id VARCHAR(255) NOT NULL) ENGINE=InnoDB`,
    );
    await q.query('ALTER TABLE deliveries ADD dedupe_key VARCHAR(100) NULL UNIQUE');
  }
  async down() {
    throw new Error('Restaurar la copia previa: no eliminar pedidos ni eventos de pago.');
  }
}
