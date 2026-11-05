import { createHash } from 'node:crypto';
import { DataSource } from 'typeorm';
import Stripe from 'stripe';
import { CommercialOffer } from '../database/entities';
import { StripeCatalogBinding } from './entities';
import { assertTest } from './stripe-client';
import { config } from '../config';
export const fingerprint = (code: string, amount: number, recurring: boolean) =>
  createHash('sha256')
    .update(`${config.STRIPE_ACCOUNT_ID}|${code}|${amount}|${recurring}`)
    .digest('hex');
export async function ensurePrice(
  db: DataSource,
  stripe: Stripe,
  code: string,
  title: string,
  amount: number,
  recurring = false,
) {
  const key = fingerprint(code, amount, recurring);
  const repo = db.getRepository(StripeCatalogBinding);
  const existing = await repo.findOneBy({ fingerprint: key });
  if (existing) {
    const p = await stripe.prices.retrieve(existing.priceId);
    assertTest(p);
    if (
      !p.active ||
      p.unit_amount !== amount ||
      p.currency !== 'eur' ||
      (p.recurring && (p.recurring.interval !== 'month' || p.recurring.interval_count !== 1)) ||
      Boolean(p.recurring) !== recurring
    )
      throw new Error('Precio sandbox desactualizado: sincroniza el catálogo.');
    return p.id;
  }
  const products = await stripe.products.list({ limit: 100 });
  let product = products.data.find((p) => p.metadata.neurocanino_price === key);
  if (!product)
    product = await stripe.products.create(
      {
        name: title,
        metadata: {
          neurocanino_code: code,
          neurocanino_price: key,
          managed_by: 'neurocanino-sandbox',
        },
      },
      { idempotencyKey: `product-${key}` },
    );
  assertTest(product);
  const prices = await stripe.prices.list({ product: product.id, limit: 100, active: true });
  let price = prices.data.find(
    (p) =>
      p.unit_amount === amount &&
      p.currency === 'eur' &&
      Boolean(p.recurring) === recurring &&
      (!p.recurring || p.recurring.interval === 'month'),
  );
  if (!price)
    price = await stripe.prices.create(
      {
        product: product.id,
        currency: 'eur',
        unit_amount: amount,
        ...(recurring ? { recurring: { interval: 'month' as const } } : {}),
        metadata: { neurocanino_price: key },
      },
      { idempotencyKey: `price-${key}` },
    );
  assertTest(price);
  await repo.upsert(
    {
      fingerprint: key,
      priceId: price.id,
      productId: product.id,
      accountId: config.STRIPE_ACCOUNT_ID,
    },
    ['fingerprint'],
  );
  return price.id;
}
export async function syncCatalog(db: DataSource, stripe: Stripe) {
  const offers = await db.getRepository(CommercialOffer).find({ relations: { options: true } });
  let count = 0;
  for (const o of offers)
    for (const p of o.options) {
      await ensurePrice(
        db,
        stripe,
        o.code,
        `${o.title} · ${p.label}`,
        p.amountCents,
        p.installmentCount > 1,
      );
      count++;
    }
  // Preserve legacy entries in the source catalog, without exposing them on the website.
  await ensurePrice(
    db,
    stripe,
    'legacy-intensive-3h',
    'SESIÓN INTENSIVA PRESENCIAL SEVILLA (3H)',
    25000,
  );
  await ensurePrice(
    db,
    stripe,
    'legacy-academy',
    'ACADEMIA + SEGUIMIENTO (PAGO 12 MESES)',
    9900,
    true,
  );
  await ensurePrice(db, stripe, 'presencial', 'Reserva de plaza · Programa presencial', 35000);
  return count;
}
