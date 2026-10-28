import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  consultation20261028 as consultation,
  stripeLinks20261028,
  reservePaymentUrl,
} from '../content/stripe-links-20261028';
export class StripeLinks1793183000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query('ALTER TABLE payment_options ADD deposit_payment_url VARCHAR(500) NULL');
    await q.query(
      'UPDATE services SET title=?, label=?, intro=?, description=?, seo_title=?, seo_description=?, action_mode=?, action_url=NULL WHERE code=?',
      [
        consultation.title,
        consultation.label,
        consultation.intro,
        consultation.description,
        consultation.seoTitle,
        consultation.seoDescription,
        'contact',
        consultation.code,
      ],
    );
    await q.query(
      'UPDATE commercial_offers SET title=?, description=?, seo_title=?, seo_description=?, booking_url=NULL, provisional=0 WHERE code=?',
      [
        consultation.title,
        consultation.description,
        consultation.seoTitle,
        consultation.seoDescription,
        consultation.code,
      ],
    );
    const [offer] = await q.query('SELECT id FROM commercial_offers WHERE code=?', ['intensiva']);
    if (offer) {
      const [option] = await q.query(
        'SELECT id FROM payment_options WHERE offer_id=? ORDER BY sort_order,id LIMIT 1',
        [offer.id],
      );
      if (option)
        await q.query(
          'UPDATE payment_options SET label=?,method=?,amount_cents=7500,installment_count=1,deposit_cents=0,balance_cents=0,payment_type=?,payment_url=NULL,deposit_payment_url=NULL WHERE id=?',
          ['Consulta individual · una hora', 'stripe', 'full', option.id],
        );
      else
        await q.query(
          'INSERT INTO payment_options (offer_id,label,method,currency,amount_cents,installment_count,deposit_cents,balance_cents,payment_type,sort_order) VALUES (?,?,?,?,7500,1,0,0,?,0)',
          [offer.id, 'Consulta individual · una hora', 'stripe', 'EUR', 'full'],
        );
    }
    for (const p of stripeLinks20261028) {
      await q.query(
        'UPDATE payment_options p JOIN commercial_offers o ON o.id=p.offer_id SET p.method=?,p.payment_url=?,p.deposit_payment_url=? WHERE o.code=? AND p.amount_cents=? AND p.installment_count=? AND p.deposit_cents=? AND p.balance_cents=?',
        [
          'stripe',
          p.url,
          p.deposit ? reservePaymentUrl : null,
          p.code,
          p.amount,
          p.count,
          p.deposit,
          p.balance,
        ],
      );
    }
    // The supplied "single payment" is actually a recurring subscription: never activate it.
    await q.query(
      'UPDATE payment_options p JOIN commercial_offers o ON o.id=p.offer_id SET p.payment_url=NULL,p.deposit_payment_url=NULL WHERE o.code=? AND p.payment_type=?',
      ['online-presencial', 'full'],
    );
    await q.query(
      'DELETE l FROM edition_payment_links l JOIN payment_options p ON p.id=l.payment_option_id JOIN commercial_offers o ON o.id=p.offer_id WHERE o.code=? AND p.payment_type=?',
      ['online-presencial', 'full'],
    );
    for (const code of ['educacion', 'rehabilitacion'])
      await q.query('UPDATE commercial_offers SET description=? WHERE code=?', [
        code === 'educacion'
          ? 'Cuatro semanas, con una sesión individual de tres horas cada semana. Contrata el programa y acuerda las sesiones con el instructor.'
          : 'Seis semanas, con una sesión individual de tres horas cada semana. Contrata el programa y acuerda las sesiones con el instructor.',
        code,
      ]);
  }
  async down() {
    throw new Error(
      'Restaurar la copia previa para revertir los enlaces y la consulta presencial del 28/10/2026.',
    );
  }
}
