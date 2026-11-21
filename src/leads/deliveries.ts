import { Inject, Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource, EntityManager, LessThanOrEqual } from 'typeorm';
import nodemailer from 'nodemailer';
import { Delivery, Session } from '../database/entities';
import { brandLogo } from '../emails/brand';
import { config } from '../config';
export async function queueEmail(
  manager: EntityManager,
  dedupeKey: string,
  mail: { subject: string; text: string; html: string },
  refs: { leadId?: string; registrationId?: string; recipient?: string } = {},
) {
  await manager
    .getRepository(Delivery)
    .insert({ dedupeKey, ...mail, ...refs, nextAttemptAt: new Date() });
}
@Injectable()
export class DeliveryWorker implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private running = false;
  private logger = new Logger(DeliveryWorker.name);
  constructor(@Inject(DataSource) private db: DataSource) {}
  onModuleInit() {
    this.timer = setInterval(() => {
      if (!this.running) {
        this.running = true;
        void this.flush()
          .catch(() => this.logger.warn('No se pudo procesar el correo.'))
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
  async flush() {
    const runner = this.db.createQueryRunner();
    await runner.connect();
    let acquired = false;
    try {
      acquired =
        Number(
          (await runner.query("SELECT GET_LOCK('neurocanino_deliveries',0) AS acquired"))[0]
            ?.acquired,
        ) === 1;
      if (!acquired) return;
      const repo = runner.manager.getRepository(Delivery);
      const pending = await repo
        .createQueryBuilder('delivery')
        .addSelect('delivery.html')
        .where('delivery.status = :status AND delivery.nextAttemptAt <= :now', {
          status: 'pending',
          now: new Date(),
        })
        .orderBy('delivery.id', 'ASC')
        .take(20)
        .getMany();
      for (const delivery of pending) {
        try {
          await this.send(delivery);
          await repo.update(delivery.id, { status: 'sent', lastError: null });
        } catch {
          const attempts = delivery.attempts + 1;
          await repo.update(delivery.id, {
            attempts,
            status: attempts >= 5 ? 'failed' : 'pending',
            nextAttemptAt: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** attempts)),
            lastError: 'No se pudo entregar el correo. Revisa la configuración SMTP y reintenta.',
          });
        }
      }
      await runner.manager
        .getRepository(Session)
        .delete({ expiresAt: LessThanOrEqual(new Date()) });
    } finally {
      if (acquired)
        await runner.query("SELECT RELEASE_LOCK('neurocanino_deliveries')").catch(() => {});
      await runner.release();
    }
  }
  async send(delivery: Delivery) {
    const recipient = delivery.recipient || config.NOTIFICATION_EMAIL;
    if (!config.SMTP_HOST || !recipient) throw new Error('Correo sin configurar.');
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
        to: recipient,
        replyTo: config.NOTIFICATION_EMAIL || config.SMTP_FROM,
        messageId: `<delivery-${delivery.id}@adiestracaninos.es>`,
        subject: delivery.subject,
        text: delivery.text,
        html: delivery.html,
        attachments: [brandLogo],
      });
    } finally {
      transport.close();
    }
  }
}
