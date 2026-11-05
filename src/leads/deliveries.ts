import { Inject, Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource, LessThanOrEqual } from 'typeorm';
import nodemailer from 'nodemailer';
import { Delivery, Lead, Session } from '../database/entities';
import { CrmAdapter } from './crm';
import { PurchaseOrder } from '../payments/entities';
import { purchaseEmail } from '../payments/email';
import { leadNotificationEmail } from '../emails/lead-notification';
import { config } from '../config';
@Injectable()
export class DeliveryWorker implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private running = false;
  onModuleInit() {
    this.timer = setInterval(() => {
      if (!this.running) {
        this.running = true;
        void this.flush()
          .catch(() =>
            this.logger.warn('La cola de avisos se reintentará al recuperar la conexión.'),
          )
          .finally(() => {
            this.running = false;
          });
      }
    }, 10000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  private logger = new Logger(DeliveryWorker.name);
  constructor(
    @Inject(DataSource) private db: DataSource,
    @Inject(CrmAdapter) private crm: CrmAdapter,
  ) {}
  async flush() {
    // MySQL advisory lock serializes workers across backend instances and is released on connection loss.
    const runner = this.db.createQueryRunner();
    await runner.connect();
    try {
      const lock = await runner.query("SELECT GET_LOCK('neurocanino_deliveries',0) AS acquired");
      if (Number(lock[0]?.acquired) !== 1) return;
      const pending = await runner.manager.getRepository(Delivery).find({
        where: { status: 'pending', nextAttemptAt: LessThanOrEqual(new Date()) },
        order: { id: 'ASC' },
        take: 20,
      });
      for (const d of pending) {
        try {
          const lead = await runner.manager.getRepository(Lead).findOneByOrFail({ id: d.leadId });
          if (d.channel === 'crm') await this.crm.upsertLead(lead);
          else if (d.channel === 'purchase_email') await this.sendPurchase(lead);
          else await this.sendEmail(lead);
          await runner.manager
            .getRepository(Delivery)
            .update(d.id, { status: 'sent', lastError: null });
        } catch (error) {
          const attempts = d.attempts + 1;
          await runner.manager.getRepository(Delivery).update(d.id, {
            attempts,
            status: attempts >= 5 ? 'failed' : 'pending',
            nextAttemptAt: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** attempts)),
            lastError: error instanceof Error ? error.message : 'Error de entrega',
          });
          this.logger.warn(`Aviso ${d.id} pendiente; intento ${attempts}.`);
        }
      }
      await runner.manager
        .getRepository(Session)
        .delete({ expiresAt: LessThanOrEqual(new Date()) });
    } catch (e) {
      this.logger.error('No se pudo procesar la cola de avisos.');
    } finally {
      await runner.query("SELECT RELEASE_LOCK('neurocanino_deliveries')").catch(() => {});
      await runner.release();
    }
  }
  async sendPurchase(lead: Lead) {
    const order = await this.db
      .getRepository(PurchaseOrder)
      .findOneByOrFail({ leadId: lead.id, isTest: true });
    if (
      !order.email ||
      !config.PURCHASE_SMTP_HOST ||
      !config.PURCHASE_SMTP_USER ||
      !config.PURCHASE_SMTP_PASSWORD
    )
      throw new Error('SMTP de compras o destinatario sin configurar.');
    const transport = nodemailer.createTransport({
      host: config.PURCHASE_SMTP_HOST,
      port: config.PURCHASE_SMTP_PORT,
      secure: config.PURCHASE_SMTP_PORT === 465,
      auth: { user: config.PURCHASE_SMTP_USER, pass: config.PURCHASE_SMTP_PASSWORD },
      connectionTimeout: 10000,
      socketTimeout: 15000,
    });
    try {
      await transport.sendMail({
        from: config.PURCHASE_SMTP_FROM,
        to: order.email,
        replyTo: 'debug@gonseclabs.com',
        messageId: `<purchase-${order.id}@gonseclabs.com>`,
        ...purchaseEmail(order),
      });
    } finally {
      transport.close();
    }
  }
  async sendEmail(lead: Lead) {
    if (!config.SMTP_HOST || !config.NOTIFICATION_EMAIL)
      throw new Error('SMTP o destinatario sin configurar.');
    const transport = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE === 'true',
      auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } : undefined,
      connectionTimeout: 10000,
      socketTimeout: 15000,
    });
    try {
      await transport.sendMail({
        from: config.SMTP_FROM,
        to: config.NOTIFICATION_EMAIL,
        replyTo: lead.email || undefined,
        ...leadNotificationEmail(lead, `${config.PUBLIC_ORIGIN}/admin/`),
      });
    } finally {
      transport.close();
    }
  }
}
