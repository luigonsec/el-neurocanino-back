import {
  BadRequestException,
  ServiceUnavailableException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Post,
  Query,
  Req,
  Headers,
  Header,
  HttpCode,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { z } from 'zod';
import { CommercialOffer, Edition } from '../database/entities';
import { PurchaseOrder, PurchaseAttempt, StripeEventRecord, PurchaseSnapshot } from './entities';
import { checkedStripe, sandboxClient, assertTest } from './stripe-client';
import { ensurePrice } from './catalog';
import { editionStatus } from '../content/edition-status';
import { paymentTotal } from '../content/commerce';
import { config, allowedOrigins } from '../config';
import { parse, apiSchema } from '../validation';
const selectionSchema = z.object({
  code: z.string().regex(/^[a-z][a-z0-9-]{1,59}$/),
  optionId: z.number().int().positive(),
  editionId: z.number().int().positive().optional(),
  requestKey: z.uuid(),
});
@ApiTags('Checkout de pruebas')
@Controller()
export class CheckoutController {
  constructor(@Inject(DataSource) private db: DataSource) {}
  @Post('checkout/sessions')
  @ApiBody({ schema: apiSchema(selectionSchema) })
  async create(@Body() body: unknown, @Headers('origin') origin?: string) {
    if (origin && !allowedOrigins.has(origin))
      throw new BadRequestException('Origen no permitido.');
    const input = parse(selectionSchema, body);
    if (
      !config.STRIPE_WEBHOOK_SECRET ||
      !config.PURCHASE_SMTP_HOST ||
      !config.PURCHASE_SMTP_USER ||
      !config.PURCHASE_SMTP_PASSWORD
    )
      throw new ServiceUnavailableException(
        'La confirmación de pagos de prueba no está configurada. No se abrirán enlaces reales.',
      );
    const stripe = await checkedStripe();
    const runner = this.db.createQueryRunner();
    await runner.connect();
    const lock =
      'checkout-' + createHash('sha256').update(input.requestKey).digest('hex').slice(0, 48);
    try {
      const acquired = await runner.query('SELECT GET_LOCK(?,10) AS acquired', [lock]);
      if (Number(acquired[0]?.acquired) !== 1)
        throw new BadRequestException('Ya se está preparando el pago. Reintenta en unos segundos.');
      const offer = await runner.manager.getRepository(CommercialOffer).findOne({
        where: { code: input.code, published: true },
        relations: { options: true, services: true },
      });
      const option = offer?.options.find((p) => p.id === input.optionId);
      if (
        !offer ||
        offer.provisional ||
        !option ||
        option.amountCents <= 0 ||
        ![1, 3, 6, 12].includes(option.installmentCount)
      )
        throw new NotFoundException('Modalidad no disponible.');
      let edition: Edition | null = null;
      if (offer.services.some((s) => s.code === 'presencial')) {
        if (!input.editionId)
          throw new BadRequestException('Selecciona una edición para continuar.');
        edition = await runner.manager
          .getRepository(Edition)
          .findOneBy({ id: input.editionId, published: true });
        if (!edition || editionStatus(edition) === 'closed' || edition.placesAvailable <= 0)
          throw new BadRequestException('La edición ya no está disponible.');
      }
      const repo = runner.manager.getRepository(PurchaseOrder);
      let order = await repo.findOneBy({ requestKey: input.requestKey });
      if (
        order &&
        (order.snapshot.code !== input.code ||
          order.snapshot.optionId !== input.optionId ||
          (order.snapshot.edition?.id || null) !== (edition?.id || null))
      )
        throw new BadRequestException('La selección ha cambiado. Inicia otra compra.');
      if (!order) {
        const snapshot: PurchaseSnapshot = {
          code: offer.code,
          title: offer.title,
          route: offer.route || offer.services[0].route,
          optionId: option.id,
          optionLabel: option.label,
          amount: option.amountCents,
          deposit: option.depositCents,
          balance: option.balanceCents,
          count: option.installmentCount,
          total: paymentTotal(option),
          kind: option.paymentType,
          edition: edition
            ? {
                id: edition.id,
                title: edition.title,
                city: edition.city,
                location: edition.location,
                startDate: edition.startDate,
                endDate: edition.endDate,
              }
            : null,
        };
        order = await repo.save(
          repo.create({
            id: randomUUID(),
            requestKey: input.requestKey,
            publicToken: randomBytes(32).toString('hex'),
            snapshot,
            isTest: true,
          }),
        );
      }
      const successUrl = `${config.PUBLIC_ORIGIN}/compra/finalizada/?pedido=${order.publicToken}`;
      if (order.amountPaid > 0) return { url: successUrl, orderToken: order.publicToken };
      const attempts = runner.manager.getRepository(PurchaseAttempt);
      let attempt = await attempts.findOne({
        where: { orderId: order.id },
        order: { createdAt: 'DESC' },
      });
      if (attempt?.sessionId) {
        const session = await stripe.checkout.sessions.retrieve(attempt.sessionId);
        assertTest(session);
        if (session.status === 'open' && session.url)
          return { url: session.url, orderToken: order.publicToken };
        if (
          session.status === 'complete' &&
          !(order.status === 'failed' && session.payment_status !== 'paid')
        )
          return { url: successUrl, orderToken: order.publicToken };
        attempt = null;
      }
      if (!attempt) attempt = await attempts.save({ id: randomUUID(), orderId: order.id });
      const s = order.snapshot;
      const price = await ensurePrice(this.db, stripe, s.code, s.title, s.amount, s.count > 1);
      const items: any[] = [{ price, quantity: 1 }];
      if (s.deposit) {
        const reserve = await ensurePrice(
          this.db,
          stripe,
          'presencial',
          'Reserva de plaza · Programa presencial',
          s.deposit,
        );
        items.push({ price: reserve, quantity: 1 });
      }
      const session = await stripe.checkout.sessions.create(
        {
          mode: s.count > 1 ? 'subscription' : 'payment',
          line_items: items,
          client_reference_id: order.id,
          metadata: { order_id: order.id },
          ...(s.count > 1
            ? { subscription_data: { metadata: { order_id: order.id } } }
            : {
                payment_intent_data: { metadata: { order_id: order.id } },
                customer_creation: 'always',
              }),
          phone_number_collection: { enabled: true },
          billing_address_collection: 'required',
          success_url: successUrl,
          cancel_url: `${config.PUBLIC_ORIGIN}${s.route}?pedido=${order.publicToken}&pago=cancelado#precios`,
        },
        { idempotencyKey: `checkout-${attempt.id}` },
      );
      assertTest(session);
      await attempts.update(attempt.id, { sessionId: session.id, url: session.url });
      return { url: session.url, orderToken: order.publicToken };
    } finally {
      await runner.query('SELECT RELEASE_LOCK(?)', [lock]).catch(() => {});
      await runner.release();
    }
  }
  @Get('checkout/status')
  @Header('Cache-Control', 'no-store')
  async status(@Query('token') token: string) {
    if (!/^[a-f0-9]{64}$/.test(token || '')) throw new NotFoundException();
    const order = await this.db
      .getRepository(PurchaseOrder)
      .findOneBy({ publicToken: token, isTest: true });
    if (!order) throw new NotFoundException();
    return {
      status: order.status,
      billingStatus: order.billingStatus,
      isTest: true,
      title: order.snapshot.title,
      option: order.snapshot.optionLabel,
      totalCents: order.snapshot.total,
      paidCents: order.amountPaid,
      pendingCents: Math.max(0, order.snapshot.total - order.amountPaid),
      installmentCount: order.snapshot.count,
      paidInstallments: order.paidInstallments,
      edition: order.snapshot.edition,
      route: order.snapshot.route,
      optionId: order.snapshot.optionId,
    };
  }
  @Post('stripe/webhook')
  @HttpCode(200)
  async webhook(@Req() req: any, @Headers('stripe-signature') signature: string) {
    if (!config.STRIPE_WEBHOOK_SECRET || !signature || !req.rawBody)
      throw new BadRequestException('Webhook no configurado o firma ausente.');
    let event: any;
    try {
      event = sandboxClient().webhooks.constructEvent(
        req.rawBody,
        signature,
        config.STRIPE_WEBHOOK_SECRET,
      );
      assertTest(event);
    } catch {
      throw new BadRequestException('Firma o entorno de Stripe inválido.');
    }
    const eventAccount = event.account || event.context;
    if (eventAccount && eventAccount !== config.STRIPE_ACCOUNT_ID)
      throw new BadRequestException('Cuenta de Stripe incorrecta.');
    // The signing secret and SDK key belong exclusively to the authorized sandbox.
    try {
      await this.db
        .getRepository(StripeEventRecord)
        .insert({ id: event.id, payload: event, status: 'pending', nextAttemptAt: new Date() });
    } catch (e: any) {
      if (e?.code !== 'ER_DUP_ENTRY') throw e;
    }
    return { received: true };
  }
}
