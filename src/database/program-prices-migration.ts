import { MigrationInterface, QueryRunner } from 'typeorm';
import { programs20261028, servicePrograms20261028 } from '../content/programs-20261028';

export class ProgramPrices1793180000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(
      `ALTER TABLE payment_options ADD payment_type VARCHAR(20) NOT NULL DEFAULT 'full', ADD balance_cents INT NOT NULL DEFAULT 0`,
    );
    await q.query(
      `UPDATE payment_options SET payment_type = 'installments' WHERE installment_count > 1`,
    );
    for (const program of programs20261028) {
      const [offer] = await q.query('SELECT id FROM commercial_offers WHERE code = ?', [
        program.code,
      ]);
      // New installations seed their commercial records after all migrations.
      if (!offer) continue;
      const p = program as any;
      await q.query(
        'UPDATE commercial_offers SET title = ?, description = ?, provisional = 0 WHERE id = ?',
        [p.title, p.description, offer.id],
      );
      if (p.seoTitle)
        await q.query(
          'UPDATE commercial_offers SET seo_title = ?, seo_description = ? WHERE id = ?',
          [p.seoTitle, p.seoDescription, offer.id],
        );
      const existing = await q.query(
        'SELECT * FROM payment_options WHERE offer_id = ? ORDER BY id',
        [offer.id],
      );
      const retained: number[] = [];
      for (let sortOrder = 0; sortOrder < p.options.length; sortOrder++) {
        const option = p.options[sortOrder];
        const count = option.installmentCount || 1;
        const deposit = option.depositCents || 0;
        const balance = option.balanceCents || 0;
        const old = existing.find(
          (o: any) =>
            !retained.includes(o.id) &&
            o.payment_type === option.paymentType &&
            o.installment_count === count,
        );
        if (old) {
          retained.push(old.id);
          const changed =
            old.amount_cents !== option.amountCents ||
            old.deposit_cents !== deposit ||
            old.balance_cents !== balance;
          if (changed) {
            await q.query('DELETE FROM edition_payment_links WHERE payment_option_id = ?', [
              old.id,
            ]);
            await q.query(
              'UPDATE payment_options SET payment_url = NULL, transfer_instructions = NULL, whatsapp_url = NULL WHERE id = ?',
              [old.id],
            );
          }
          await q.query(
            'UPDATE payment_options SET label = ?, amount_cents = ?, installment_count = ?, deposit_cents = ?, balance_cents = ?, payment_type = ?, sort_order = ? WHERE id = ?',
            [
              option.label,
              option.amountCents,
              count,
              deposit,
              balance,
              option.paymentType,
              sortOrder,
              old.id,
            ],
          );
        } else {
          const result = await q.query(
            'INSERT INTO payment_options (offer_id, label, method, currency, amount_cents, installment_count, deposit_cents, balance_cents, payment_type, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              offer.id,
              option.label,
              option.method,
              'EUR',
              option.amountCents,
              count,
              deposit,
              balance,
              option.paymentType,
              sortOrder,
            ],
          );
          retained.push(result.insertId);
        }
      }
      // Cascades also remove obsolete edition checkout links (e.g. 550 € × 3).
      for (const old of existing)
        if (!retained.includes(old.id))
          await q.query('DELETE FROM payment_options WHERE id = ?', [old.id]);
    }
    for (const service of servicePrograms20261028) {
      await q.query(
        'UPDATE services SET title = ?, label = ?, intro = ?, description = ?, seo_title = ?, seo_description = ? WHERE code = ?',
        [
          service.title,
          service.label,
          service.intro,
          service.description,
          service.seoTitle,
          service.seoDescription,
          service.code,
        ],
      );
    }
  }
  async down() {
    // Reverting would silently turn a reservation into a full payment and restore obsolete prices.
    throw new Error(
      'Restaurar la copia previa para revertir las condiciones comerciales del 28/10/2026.',
    );
  }
}
