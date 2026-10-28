import { EntityManager } from 'typeorm';
import { CommercialOffer, Service } from './entities';
import { commercialDefaults } from '../content/commerce-data';

export async function seedCommerce(manager: EntityManager) {
  const services = await manager.getRepository(Service).find();
  for (const defaults of commercialDefaults) {
    if (await manager.getRepository(CommercialOffer).existsBy({ code: defaults.code })) continue;
    const linked = services.filter((s) =>
      (defaults.serviceCodes as readonly string[]).includes(s.code),
    );
    if (linked.length !== defaults.serviceCodes.length) continue;
    const row = defaults as any;
    const offer = await manager.getRepository(CommercialOffer).save({
      code: row.code,
      title: row.title,
      description: row.description,
      route: row.route || null,
      seoTitle: row.seoTitle || null,
      seoDescription: row.seoDescription || null,
      published: true,
      provisional: Boolean(row.provisional),
      bookingUrl: null,
      klarnaEnabled: false,
      services: linked,
    });
    for (const [sortOrder, option] of row.options.entries()) {
      // Historical schema migrations invoke this seed before the new columns exist.
      // Use explicit columns so a clean installation can traverse that schema safely.
      const hasPaymentType =
        (await manager.query("SHOW COLUMNS FROM payment_options LIKE 'payment_type'")).length > 0;
      const columns = [
        'offer_id',
        'label',
        'method',
        'currency',
        'amount_cents',
        'installment_count',
        'deposit_cents',
        'sort_order',
      ];
      const values = [
        offer.id,
        option.label,
        option.method,
        'EUR',
        option.amountCents,
        option.installmentCount || 1,
        option.depositCents || 0,
        sortOrder,
      ];
      if (hasPaymentType) {
        columns.push('payment_type', 'balance_cents');
        values.push(
          option.paymentType || (option.installmentCount > 1 ? 'installments' : 'full'),
          option.balanceCents || 0,
        );
      }
      await manager.query(
        `INSERT INTO payment_options (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`,
        values,
      );
    }
  }
}
