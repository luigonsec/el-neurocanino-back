import { Inject, Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { DataSource, LessThanOrEqual } from 'typeorm';
import { randomUUID, createHash } from 'node:crypto';
import { finitePhase, validateReceipt } from './rules';
import { PurchaseOrder, PurchaseReceipt, StripeEventRecord } from './entities';
import { Lead, Delivery } from '../database/entities';
import { checkedStripe, assertTest } from './stripe-client';
import { config } from '../config';
const idOf = (v: any): string | null => (typeof v === 'string' ? v : v?.id || null);
const money = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n / 100);
export function purchaseMessage(order: PurchaseOrder) {
  const s = order.snapshot;
  return `[PRUEBA] ${s.title}\n${s.optionLabel}\nTotal: ${money(s.total)}\nCobrado: ${money(order.amountPaid)}\nPendiente: ${money(Math.max(0, s.total - order.amountPaid))}\nEstado: ${order.status} · ${order.billingStatus}\n${s.count > 1 ? `Cuotas abonadas: ${order.paidInstallments}/${s.count}` : ''}\n${s.edition ? `Edición: ${s.edition.title} · ${s.edition.startDate} — ${s.edition.endDate} · ${s.edition.location}, ${s.edition.city}` : ''}`;
}
@Injectable()
export class PaymentWorker implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private running = false;
  private logger = new Logger(PaymentWorker.name);
  constructor(@Inject(DataSource) private db: DataSource) {}
  onModuleInit() {
    if (config.STRIPE_MODE !== 'sandbox') return;
    this.timer = setInterval(() => {
      if (!this.running) {
        this.running = true;
        void this.flush()
          .catch(() =>
            this.logger.warn('La cola de pagos se reintentará al recuperar la conexión.'),
          )
          .finally(() => (this.running = false));
      }
    }, 2000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async flush() {
    const runner = this.db.createQueryRunner();
    await runner.connect();
    try {
      const [lock] = await runner.query(
        "SELECT GET_LOCK('neurocanino_stripe_events',0) AS acquired",
      );
      if (Number(lock.acquired) !== 1) return;
      const repo = runner.manager.getRepository(StripeEventRecord);
      const pending = await repo.find({
        where: { status: 'pending', nextAttemptAt: LessThanOrEqual(new Date()) },
        order: { createdAt: 'ASC' },
        take: 20,
      });
      for (const event of pending) {
        try {
          await this.process(event.payload);
          await repo.update(event.id, { status: 'processed', lastError: null });
        } catch (e) {
          const attempts = event.attempts + 1;
          await repo.update(event.id, {
            attempts,
            status: attempts >= 8 ? 'failed' : 'pending',
            nextAttemptAt: new Date(Date.now() + Math.min(3600000, 1000 * 2 ** attempts)),
            lastError: e instanceof Error ? e.message.slice(0, 1000) : 'Error de procesamiento',
          });
        }
      }
    } finally {
      await runner.query("SELECT RELEASE_LOCK('neurocanino_stripe_events')").catch(() => {});
      await runner.release();
    }
  }
  async process(event: any) {
    assertTest(event);
    const stripe = await checkedStripe();
    const data = event.data?.object;
    if (!data) return;
    if (event.type.startsWith('checkout.session.')) {
      const session = await stripe.checkout.sessions.retrieve(data.id, {
        expand: ['subscription', 'invoice'],
      });
      assertTest(session);
      const order = await this.db
        .getRepository(PurchaseOrder)
        .findOneBy({
          id: session.metadata?.order_id || session.client_reference_id || '',
          isTest: true,
        });
      if (!order) return;
      if (session.metadata?.order_id !== order.id)
        throw new Error('Pedido de sesión no reconocido.');
      const sub = idOf(session.subscription);
      await this.db.getRepository(PurchaseOrder).update(order.id, {
        subscriptionId: sub,
        name: session.customer_details?.name || order.name,
        email: session.customer_details?.email || order.email,
        phone: session.customer_details?.phone || order.phone,
      });
      if (session.payment_status === 'paid') {
        if (sub) {
          const invoiceId =
            idOf(session.invoice) || idOf((session.subscription as any)?.latest_invoice);
          if (!invoiceId) throw new Error('Factura inicial pendiente.');
          await this.invoice(invoiceId);
        } else
          await this.record(
            order.id,
            `checkout-${session.id}`,
            session.amount_total || 0,
            false,
            session.currency || '',
          );
      } else if (event.type === 'checkout.session.async_payment_failed')
        await this.db
          .getRepository(PurchaseOrder)
          .update(order.id, { status: order.amountPaid ? 'partial' : 'failed' });
      if (sub) await this.schedule(order.id, sub);
      return;
    }
    if (event.type === 'invoice.paid') {
      await this.invoice(data.id);
      return;
    }
    if (event.type === 'invoice.payment_failed') {
      const invoice: any = await stripe.invoices.retrieve(data.id);
      assertTest(invoice);
      if (invoice.status === 'paid') {
        await this.invoice(invoice.id);
        return;
      }
      const sub = idOf(invoice.parent?.subscription_details?.subscription || invoice.subscription);
      if (!sub) return;
      const subscription: any = await stripe.subscriptions.retrieve(sub);
      assertTest(subscription);
      const order = await this.db
        .getRepository(PurchaseOrder)
        .findOneBy({ id: subscription.metadata.order_id || '', isTest: true });
      if (order && idOf(subscription.latest_invoice) === invoice.id) {
        await this.db.getRepository(PurchaseOrder).update(order.id, {
          subscriptionId: sub,
          billingStatus: 'past_due',
          status: order.amountPaid ? 'partial' : 'failed',
        });
        await this.updateCrm(order.id);
      }
      return;
    }
    if (['customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
      const subscription: any = await stripe.subscriptions.retrieve(data.id);
      assertTest(subscription);
      const order = await this.db
        .getRepository(PurchaseOrder)
        .findOneBy({ id: subscription.metadata.order_id || '', isTest: true });
      if (!order) return;
      const completed =
        order.paidInstallments >= order.snapshot.count && order.amountPaid >= order.snapshot.total;
      const billingStatus = completed
        ? 'completed'
        : subscription.status === 'canceled'
          ? 'cancelled'
          : ['past_due', 'unpaid'].includes(subscription.status)
            ? 'past_due'
            : 'active';
      await this.db.getRepository(PurchaseOrder).update(order.id, {
        subscriptionId: subscription.id,
        billingStatus,
        ...(completed
          ? { status: 'paid' }
          : subscription.status === 'canceled' && !order.amountPaid
            ? { status: 'failed' }
            : {}),
      });
      await this.updateCrm(order.id);
      if (subscription.status !== 'canceled') await this.schedule(order.id, subscription.id);
    }
  }
  private async invoice(invoiceId: string) {
    const stripe = await checkedStripe();
    const invoice: any = await stripe.invoices.retrieve(invoiceId);
    assertTest(invoice);
    if (invoice.status !== 'paid' || invoice.amount_remaining !== 0) return;
    const sub = idOf(invoice.parent?.subscription_details?.subscription || invoice.subscription);
    if (!sub) return;
    const subscription: any = await stripe.subscriptions.retrieve(sub);
    assertTest(subscription);
    const order = await this.db
      .getRepository(PurchaseOrder)
      .findOneBy({ id: subscription.metadata.order_id || '', isTest: true });
    if (!order) return;
    await this.db.getRepository(PurchaseOrder).update(order.id, {
      subscriptionId: sub,
      email: invoice.customer_email || order.email,
      name: invoice.customer_name || order.name,
      phone: invoice.customer_phone || order.phone,
    });
    await this.record(
      order.id,
      invoice.id,
      invoice.amount_paid,
      true,
      invoice.currency,
      invoice.billing_reason === 'subscription_create',
    );
    if (subscription.status !== 'canceled') await this.schedule(order.id, sub);
  }
  private async record(
    orderId: string,
    receiptId: string,
    amount: number,
    installment: boolean,
    currency: string,
    initial = false,
  ) {
    await this.db.transaction(async (manager) => {
      const repo = manager.getRepository(PurchaseOrder);
      const order = await repo.findOneOrFail({
        where: { id: orderId, isTest: true },
        lock: { mode: 'pessimistic_write' },
      });
      validateReceipt(order.snapshot, amount, currency, installment, initial);
      const receipts = manager.getRepository(PurchaseReceipt);
      if (!(await receipts.existsBy({ id: receiptId })))
        await receipts.insert({ id: receiptId, orderId, amount, isInstallment: installment });
      const all = await receipts.findBy({ orderId });
      const paid = all.reduce((n, r) => n + r.amount, 0),
        count = all.filter((r) => r.isInstallment).length;
      if (paid > order.snapshot.total || count > order.snapshot.count)
        throw new Error('Cobro superior al total contratado: revisar el pedido.');
      const s = order.snapshot;
      order.amountPaid = paid;
      order.paidInstallments = count;
      order.status = paid >= s.total ? 'paid' : s.count > 1 ? 'partial' : 'deposit_paid';
      order.billingStatus = s.count > 1 ? (paid >= s.total ? 'completed' : 'active') : 'none';
      if (!order.leadId) {
        if (!order.email) throw new Error('Email del comprador pendiente.');
        const lead = await manager.getRepository(Lead).save({
          id: randomUUID(),
          kind: 'purchase',
          source: 'stripe-sandbox',
          serviceCode: s.code === 'online-presencial' ? null : s.code,
          editionId: s.edition?.id || null,
          name: order.name || 'Comprador de prueba',
          email: order.email,
          phone: order.phone,
          city: s.edition?.city || null,
          message: purchaseMessage(order),
          privacyVersion: 'purchase-2026-10',
          status: 'new',
        });
        order.leadId = lead.id;
        for (const channel of ['purchase_email'])
          await manager.getRepository(Delivery).insert({
            leadId: lead.id,
            channel,
            dedupeKey: `${order.id}-${channel}`,
            status: 'pending',
            nextAttemptAt: new Date(),
          });
      } else
        await manager.getRepository(Lead).update(order.leadId, {
          message: purchaseMessage(order),
          name: order.name || 'Comprador de prueba',
          email: order.email,
          phone: order.phone,
        });
      await repo.save(order);
      await this.queueCrm(manager, order);
    });
  }
  private async updateCrm(id: string) {
    const order = await this.db.getRepository(PurchaseOrder).findOneByOrFail({ id, isTest: true });
    if (order.leadId) {
      await this.db.getRepository(Lead).update(order.leadId, { message: purchaseMessage(order) });
      await this.queueCrm(this.db.manager, order);
    }
  }
  private async queueCrm(manager: DataSource['manager'], order: PurchaseOrder) {
    const version = createHash('sha256').update(purchaseMessage(order)).digest('hex').slice(0, 32);
    await manager
      .createQueryBuilder()
      .insert()
      .into(Delivery)
      .values({
        leadId: order.leadId!,
        channel: 'crm',
        dedupeKey: `${order.id}-crm-${version}`,
        status: 'pending',
        nextAttemptAt: new Date(),
      })
      .orIgnore()
      .updateEntity(false)
      .execute();
  }
  private async schedule(orderId: string, subscriptionId: string) {
    const repo = this.db.getRepository(PurchaseOrder);
    const order = await repo.findOneByOrFail({ id: orderId, isTest: true });
    if (order.snapshot.count <= 1 || order.scheduleId) return;
    const stripe = await checkedStripe();
    const sub: any = await stripe.subscriptions.retrieve(subscriptionId);
    assertTest(sub);
    if (sub.status === 'canceled') return;
    const schedule: any = sub.schedule
      ? await stripe.subscriptionSchedules.retrieve(idOf(sub.schedule)!)
      : await stripe.subscriptionSchedules.create(
          { from_subscription: subscriptionId },
          { idempotencyKey: `schedule-${order.id}` },
        );
    assertTest(schedule);
    const phase = schedule.phases[0];
    const item = sub.items.data[0];
    if (
      sub.items.data.length !== 1 ||
      item.quantity !== 1 ||
      item.price.currency !== 'eur' ||
      item.price.unit_amount !== order.snapshot.amount ||
      item.price.recurring?.interval !== 'month' ||
      item.price.recurring?.interval_count !== 1
    )
      throw new Error('La suscripción no coincide con las cuotas del pedido. Revisión necesaria.');
    await stripe.subscriptionSchedules.update(
      schedule.id,
      {
        end_behavior: 'cancel',
        phases: [
          finitePhase(phase.start_date, idOf(sub.items.data[0].price)!, order.snapshot.count),
        ],
      },
      { idempotencyKey: `schedule-configure-${order.id}` },
    );
    await repo.update(order.id, { scheduleId: schedule.id });
  }
}
