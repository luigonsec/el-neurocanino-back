import { confirmedBookings } from '../content/booking-defaults';
import { EntityManager } from 'typeorm';
import { CommercialOffer, Service } from './entities';
import { commercialDefaults } from '../content/commerce-data';
import { completeProgramCardSubtitle } from '../content/landing-cards';
import { completeCardSubtitle20261105 } from '../content/service-content-20261105';

export async function seedCommerce(manager: EntityManager) {
  // This seed also runs in a historical migration, before later service columns exist.
  const services = await manager.getRepository(Service).find({ select: { id: true, code: true } });
  for (const defaults of commercialDefaults) {
    if (await manager.getRepository(CommercialOffer).existsBy({ code: defaults.code })) continue;
    const linked = services.filter((s) =>
      (defaults.serviceCodes as readonly string[]).includes(s.code),
    );
    if (linked.length !== defaults.serviceCodes.length) continue;
    const row = defaults as any;
    const hasCardSubtitle =
      (await manager.query("SHOW COLUMNS FROM commercial_offers LIKE 'card_subtitle'")).length > 0;
    const offer = await manager.getRepository(CommercialOffer).save({
      code: row.code,
      title: row.title,
      ...(hasCardSubtitle && row.code === 'online-presencial'
        ? { cardSubtitle: completeCardSubtitle20261105 || completeProgramCardSubtitle }
        : {}),
      description: row.description,
      route: row.route || null,
      seoTitle: row.seoTitle || null,
      seoDescription: row.seoDescription || null,
      published: true,
      provisional: Boolean(row.provisional),
      bookingUrl: row.code === 'intensiva' ? null : confirmedBookings[row.code] || null,
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
        'payment_url',
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
        option.paymentUrl || null,
      ];
      if (hasPaymentType) {
        columns.push('payment_type', 'balance_cents');
        values.push(
          option.paymentType || (option.installmentCount > 1 ? 'installments' : 'full'),
          option.balanceCents || 0,
        );
      }
      if (
        (await manager.query("SHOW COLUMNS FROM payment_options LIKE 'deposit_payment_url'")).length
      ) {
        columns.push('deposit_payment_url');
        values.push(option.depositPaymentUrl || null);
      }
      await manager.query(
        `INSERT INTO payment_options (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`,
        values,
      );
    }
  }
}
