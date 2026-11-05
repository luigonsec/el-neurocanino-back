import type { PurchaseSnapshot } from './entities';

/** A price change in Stripe must never silently change an existing order. */
export function validateReceipt(
  snapshot: PurchaseSnapshot,
  amount: number,
  currency: string,
  installment: boolean,
  initial = false,
) {
  const expected =
    snapshot.amount + (installment ? (initial ? snapshot.deposit : 0) : snapshot.deposit);
  if (currency !== 'eur' || !Number.isSafeInteger(amount) || amount !== expected)
    throw new Error(
      'El cobro no coincide con la modalidad contratada. Revisar antes de confirmar.',
    );
  if (installment !== snapshot.count > 1)
    throw new Error('El tipo de cobro no corresponde al pedido.');
}

export function finitePhase(start: number, price: string, count: number) {
  if (![3, 6, 12].includes(count)) throw new Error('Número de mensualidades no admitido.');
  return {
    start_date: start,
    items: [{ price, quantity: 1 }],
    duration: { interval: 'month' as const, interval_count: count },
    proration_behavior: 'none' as const,
  };
}
