import 'reflect-metadata';
import Stripe from 'stripe';
import {
  PurchaseOrder,
  PurchaseReceipt,
  StripeEventRecord,
  PurchaseSnapshot,
} from '../src/payments/entities';
import { Delivery, Lead } from '../src/database/entities';
import { PaymentWorker } from '../src/payments/worker';
import { CheckoutController } from '../src/payments/checkout';
import { purchaseEmail } from '../src/payments/email';
import { finitePhase, validateReceipt } from '../src/payments/rules';
import { DeliveryWorker } from '../src/leads/deliveries';
import { config } from '../src/config';
import { checkedStripe } from '../src/payments/stripe-client';
jest.mock('../src/payments/stripe-client', () => ({
  checkedStripe: jest.fn(),
  sandboxClient: () => new (require('stripe'))('sk_test_fixture'),
  assertTest: (v: any) => {
    if (v.livemode !== false) throw Error('Objeto ajeno al entorno de pruebas');
  },
}));
const snapshot: PurchaseSnapshot = {
  code: 'online-presencial',
  title: 'Programa completo',
  route: '/servicios/programa-online-presencial/',
  optionId: 1,
  optionLabel: '12 meses + reserva',
  amount: 14900,
  deposit: 35000,
  balance: 0,
  count: 12,
  total: 213800,
  kind: 'installments',
  edition: {
    id: 1,
    title: 'Sevilla',
    city: 'Sevilla',
    location: 'Campo',
    startDate: '2027-01-01',
    endDate: '2027-01-04',
  },
};
function memoryDb() {
  const rows = new Map<any, any[]>([
    [
      PurchaseOrder,
      [
        {
          id: 'order',
          snapshot,
          amountPaid: 0,
          paidInstallments: 0,
          email: 'buyer@example.test',
          name: '<Luis>',
          phone: null,
          leadId: null,
        },
      ],
    ],
    [PurchaseReceipt, []],
    [Lead, []],
    [Delivery, []],
  ]);
  const repo = (e: any) => ({
    findOneOrFail: async () => rows.get(e)![0],
    findOneByOrFail: async () => rows.get(e)![0],
    existsBy: async ({ id }: any) => rows.get(e)!.some((r) => r.id === id),
    findBy: async ({ orderId }: any) => rows.get(e)!.filter((r) => r.orderId === orderId),
    insert: async (v: any) => {
      rows.get(e)!.push({ ...v });
    },
    save: async (v: any) => {
      const i = rows.get(e)!.findIndex((r) => r.id === v.id);
      if (i < 0) rows.get(e)!.push(v);
      else rows.get(e)![i] = v;
      return v;
    },
    update: async (id: string, v: any) =>
      Object.assign(
        rows.get(e)!.find((r) => r.id === id),
        v,
      ),
  });
  const manager: any = {
    getRepository: repo,
    createQueryBuilder: () => {
      let table: any, value: any;
      const b: any = {
        insert: () => b,
        into: (e: any) => ((table = e), b),
        values: (v: any) => ((value = v), b),
        orIgnore: () => b,
        updateEntity: () => b,
        execute: async () => {
          if (!rows.get(table)!.some((r) => r.dedupeKey === value.dedupeKey))
            rows.get(table)!.push(value);
        },
      };
      return b;
    },
  };
  return { rows, manager, getRepository: repo, transaction: async (fn: any) => fn(manager) };
}
describe('Contratos de compra del sandbox', () => {
  it('cuenta la reserva una vez y configura exactamente 3, 6 o 12 mensualidades', () => {
    for (const [count, amount, total] of [
      [3, 56500, 204500],
      [6, 29000, 209000],
      [12, 14900, 213800],
    ]) {
      const s = { ...snapshot, count, amount, total };
      expect(amount * count + 35000).toBe(total);
      expect(() => validateReceipt(s, amount + 35000, 'eur', true, true)).not.toThrow();
      expect(() => validateReceipt(s, amount, 'eur', true)).not.toThrow();
      expect(() => validateReceipt(s, amount + 35000, 'eur', true, false)).toThrow();
      const phase = finitePhase(100, 'price_sandbox', count);
      expect(phase.duration.interval_count).toBe(count);
      expect(phase.items).toEqual([{ price: 'price_sandbox', quantity: 1 }]);
    }
    expect(() => finitePhase(100, 'price', 13)).toThrow();
    expect(() => validateReceipt(snapshot, 49900, 'usd', true, true)).toThrow();
    expect(() => validateReceipt(snapshot, 14900, 'eur', false)).toThrow();
  });
  it('cobra 2.000 € una sola vez en el completo y conserva el saldo de la reserva presencial', () => {
    expect(() =>
      validateReceipt(
        { ...snapshot, count: 1, amount: 200000, deposit: 0, total: 200000 },
        200000,
        'eur',
        false,
      ),
    ).not.toThrow();
    expect(() =>
      validateReceipt(
        { ...snapshot, count: 1, amount: 35000, deposit: 0, balance: 115000, total: 150000 },
        35000,
        'eur',
        false,
      ),
    ).not.toThrow();
  });
  it('no duplica cobros, CRM ni bienvenida al repetir o desordenar facturas', async () => {
    const db = memoryDb();
    const worker: any = new PaymentWorker(db as any);
    await worker.record('order', 'invoice-2', 14900, true, 'eur');
    await worker.record('order', 'invoice-1', 49900, true, 'eur', true);
    await worker.record('order', 'invoice-1', 49900, true, 'eur', true);
    expect(db.rows.get(PurchaseReceipt)).toHaveLength(2);
    expect(db.rows.get(Lead)).toHaveLength(1);
    expect(db.rows.get(Delivery)!.filter((d) => d.channel === 'purchase_email')).toHaveLength(1);
    expect(db.rows.get(Delivery)!.filter((d) => d.channel === 'crm')).toHaveLength(2);
    expect(db.rows.get(PurchaseOrder)![0]).toMatchObject({
      amountPaid: 64800,
      paidInstallments: 2,
      status: 'partial',
    });
  });
  it('rechaza importes ajenos antes de crear recibos o conceder una compra', async () => {
    const db = memoryDb(),
      worker: any = new PaymentWorker(db as any);
    await expect(worker.record('order', 'invoice-incorrect', 200000, true, 'eur')).rejects.toThrow(
      'no coincide',
    );
    expect(db.rows.get(PurchaseReceipt)).toHaveLength(0);
    expect(db.rows.get(Lead)).toHaveLength(0);
  });
  it('consulta el estado actual de Stripe ante un evento de impago atrasado', async () => {
    const db: any = memoryDb();
    const invoice = jest.fn().mockResolvedValue({ id: 'in_paid', livemode: false, status: 'paid' });
    (checkedStripe as jest.Mock).mockResolvedValue({ invoices: { retrieve: invoice } });
    const worker: any = new PaymentWorker(db),
      paid = jest.spyOn(worker, 'invoice').mockResolvedValue(undefined);
    await worker.process({
      livemode: false,
      type: 'invoice.payment_failed',
      data: { object: { id: 'in_paid' } },
    });
    expect(paid).toHaveBeenCalledWith('in_paid');
  });
  it('verifica firma sobre el cuerpo original y acepta eventos repetidos sin duplicarlos', async () => {
    const secret = 'whsec_unit';
    const old = config.STRIPE_WEBHOOK_SECRET;
    config.STRIPE_WEBHOOK_SECRET = secret;
    const stripe = new Stripe('sk_test_fixture'),
      insert = jest.fn().mockResolvedValue({});
    const controller = new CheckoutController({ getRepository: () => ({ insert }) } as any);
    const payload = JSON.stringify({
      id: 'evt_unit',
      object: 'event',
      livemode: false,
      type: 'invoice.paid',
      data: { object: { id: 'in_unit' } },
    });
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
    try {
      await expect(controller.webhook({ rawBody: Buffer.from(payload) }, header)).resolves.toEqual({
        received: true,
      });
      insert.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
      await expect(controller.webhook({ rawBody: Buffer.from(payload) }, header)).resolves.toEqual({
        received: true,
      });
      await expect(
        controller.webhook({ rawBody: Buffer.from(payload + ' ') }, header),
      ).rejects.toThrow();
      expect(insert).toHaveBeenCalledTimes(2);
      const live = payload.replace('"livemode":false', '"livemode":true');
      await expect(
        controller.webhook(
          { rawBody: Buffer.from(live) },
          stripe.webhooks.generateTestHeaderString({ payload: live, secret }),
        ),
      ).rejects.toThrow();
    } finally {
      config.STRIPE_WEBHOOK_SECRET = old;
    }
  });
  it('no expone datos personales al consultar la página de confirmación', async () => {
    const db = memoryDb(),
      controller = new CheckoutController(db as any);
    (db as any).getRepository = () => ({ findOneBy: async () => db.rows.get(PurchaseOrder)![0] });
    const status = await controller.status('a'.repeat(64));
    expect(status).not.toHaveProperty('email');
    expect(status).not.toHaveProperty('name');
    expect(status).not.toHaveProperty('phone');
    await expect(controller.status('order')).rejects.toThrow();
    expect(db.rows.get(Lead)).toHaveLength(0);
    expect(db.rows.get(Delivery)).toHaveLength(0);
  });
  it('escapa contenido y explica el seguimiento, las cuotas y la ausencia de acceso automático', () => {
    const email = purchaseEmail({ snapshot, name: '<Luis>', amountPaid: 49900 } as any);
    expect(email.subject).toContain('[PRUEBA]');
    expect(email.html).toContain('&lt;Luis&gt;');
    expect(email.html).not.toContain('Hola <Luis>');
    expect(email.text).toContain('499,00');
    expect(email.text).toMatch(/2\.?138,00/);
    expect(email.text).toContain('12 mensualidades');
    expect(email.text).toContain('Tras finalizar los cuatro días');
    expect(email.text).toContain('ni concedido acceso automático a Skool');
  });
  it('un fallo SMTP de compra conserva el pedido y el aviso se puede reintentar', async () => {
    const update = jest.fn(),
      delivery = { id: 1, leadId: 'lead', channel: 'purchase_email', attempts: 0 };
    let pending = [delivery];
    const runner: any = {
      connect: jest.fn(),
      release: jest.fn(),
      query: jest.fn().mockResolvedValue([{ acquired: 1 }]),
      manager: {
        getRepository: () => ({
          find: async () => pending,
          findOneByOrFail: async () => ({ id: 'lead' }),
          update,
          delete: jest.fn(),
        }),
      },
    };
    const worker = new DeliveryWorker({ createQueryRunner: () => runner } as any, {} as any);
    const send = jest
      .spyOn(worker, 'sendPurchase')
      .mockRejectedValueOnce(Error('SMTP no disponible'))
      .mockResolvedValueOnce(undefined);
    await worker.flush();
    expect(update).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({ status: 'pending', attempts: 1 }),
    );
    await worker.flush();
    expect(update).toHaveBeenLastCalledWith(1, { status: 'sent', lastError: null });
    expect(send).toHaveBeenCalledTimes(2);
  });
});
