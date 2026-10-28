import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { DataSource, EntityManager, In } from 'typeorm';
import { z } from 'zod';
import { CommercialOffer, EditionPaymentLink, PaymentOption, Service } from '../database/entities';
import { SessionGuard } from '../auth/auth';
import { config } from '../config';
import { apiSchema, calendlyUrl, externalUrl, optionalText, parse } from '../validation';
import { DEMO_CALENDLY_URL, PACK_ROUTE } from './commerce-data';

export const stripeUrl = externalUrl.refine(
  (value) =>
    ['buy.stripe.com', 'checkout.stripe.com'].includes(new URL(value).hostname) &&
    !new URL(value).username,
  'Usa un enlace de pago alojado en Stripe.',
);
const nullableUrl = (schema: z.ZodType<string>) => schema.nullish().transform((v) => v || null);
export const paymentOptionSchema = z
  .object({
    id: z.number().int().positive().optional(),
    label: z.string().trim().min(2).max(255),
    method: z.enum(['stripe', 'transfer', 'calendly']),
    currency: z.literal('EUR').default('EUR'),
    amountCents: z.number().int().min(1).max(100000000),
    installmentCount: z.number().int().min(1).max(60).default(1),
    depositCents: z.number().int().min(0).max(100000000).default(0),
    paymentType: z.enum(['full', 'installments', 'reservation']).optional(),
    balanceCents: z.number().int().min(0).max(100000000).default(0),
    paymentUrl: nullableUrl(externalUrl),
    transferInstructions: optionalText(4000),
    whatsappUrl: nullableUrl(
      externalUrl.refine(
        (v) => ['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'].includes(new URL(v).hostname),
        'Usa un enlace de WhatsApp.',
      ),
    ),
  })
  .superRefine((v, c) => {
    const kind = v.paymentType || (v.installmentCount > 1 ? 'installments' : 'full');
    if (
      (kind === 'reservation' &&
        (v.installmentCount !== 1 || v.depositCents !== 0 || v.balanceCents <= 0)) ||
      (kind !== 'reservation' && v.balanceCents !== 0) ||
      (kind === 'full' && (v.installmentCount !== 1 || v.depositCents !== 0)) ||
      (kind === 'installments' && v.installmentCount < 2)
    )
      c.addIssue({
        code: 'custom',
        path: ['paymentType'],
        message: 'Revisa el tipo de pago, las cuotas y el saldo pendiente.',
      });
    if (v.method === 'stripe' && v.paymentUrl && !stripeUrl.safeParse(v.paymentUrl).success)
      c.addIssue({
        code: 'custom',
        path: ['paymentUrl'],
        message: 'Usa un enlace de pago alojado en Stripe.',
      });
    if (v.method === 'calendly' && v.paymentUrl && !calendlyUrl.safeParse(v.paymentUrl).success)
      c.addIssue({ code: 'custom', path: ['paymentUrl'], message: 'Usa un enlace de Calendly.' });
    if (v.method !== 'stripe' && (v.installmentCount !== 1 || v.depositCents !== 0))
      c.addIssue({
        code: 'custom',
        path: ['installmentCount'],
        message: 'Las cuotas y la reserva inicial se configuran en las opciones Stripe.',
      });
  });
export const offerSchema = z
  .object({
    code: z.string().regex(/^[a-z][a-z0-9-]{1,59}$/),
    title: z.string().trim().min(2).max(255),
    description: z.string().trim().min(10).max(10000),
    route: z
      .literal(PACK_ROUTE)
      .nullish()
      .transform((v) => v || null),
    bookingUrl: nullableUrl(calendlyUrl),
    seoTitle: optionalText(),
    seoDescription: optionalText(500),
    provisional: z.boolean(),
    published: z.boolean(),
    klarnaEnabled: z.boolean().default(false),
    serviceCodes: z
      .array(z.string().max(40))
      .min(1)
      .max(6)
      .refine((a) => new Set(a).size === a.length, 'No repitas servicios.'),
    options: z
      .array(paymentOptionSchema)
      .max(12)
      .refine((a) => {
        const ids = a.flatMap((v) => (v.id ? [v.id] : []));
        return new Set(ids).size === ids.length;
      }, 'No repitas opciones de pago.'),
  })
  .refine((v) => !v.route || v.code === 'online-presencial', {
    path: ['route'],
    message: 'La página del pack corresponde a online-presencial.',
  })
  .superRefine((v, c) => {
    const expected: Record<string, string[]> = {
      comunidad: ['comunidad'],
      online: ['online'],
      presencial: ['presencial'],
      intensiva: ['intensiva'],
      educacion: ['educacion'],
      rehabilitacion: ['rehabilitacion'],
      'online-presencial': ['online', 'presencial'],
    };
    if (
      expected[v.code] &&
      (v.serviceCodes.length !== expected[v.code].length ||
        !expected[v.code].every((code) => v.serviceCodes.includes(code)))
    )
      c.addIssue({
        code: 'custom',
        path: ['serviceCodes'],
        message: 'Los servicios incluidos no corresponden a esta oferta.',
      });
  });
export type OfferValues = z.infer<typeof offerSchema>;
export const editionPaymentLinkSchema = z.object({
  paymentOptionId: z.number().int().positive(),
  url: externalUrl,
});

export function isDemoBooking(url: string | null | undefined) {
  return url === DEMO_CALENDLY_URL;
}
export function safeBooking(url: string | null | undefined, env = config.APP_ENV): string | null {
  if (!url || (env === 'production' && isDemoBooking(url))) return null;
  return url;
}
export function publicOffer(offer: CommercialOffer, env = config.APP_ENV) {
  const requiresEdition = offer.services.some((s) => s.code === 'presencial');
  const legacy =
    offer.services.length === 1 && offer.services[0].actionMode === 'calendly'
      ? offer.services[0].actionUrl
      : null;
  const candidate = offer.bookingUrl || legacy;
  const bookingUrl = requiresEdition
    ? null
    : safeBooking(candidate, env) ||
      (env !== 'production' && offer.code !== 'comunidad' ? DEMO_CALENDLY_URL : null);
  const hidePrices = env === 'production' && offer.provisional;
  return {
    ...offer,
    services: offer.services.map((s) => ({
      code: s.code,
      title: s.title,
      route: s.route,
      image: s.cardImage || s.image,
    })),
    requiresEdition,
    bookingUrl,
    bookingIsDemo: isDemoBooking(bookingUrl),
    klarnaEnabled: Boolean(offer.klarnaEnabled && bookingUrl && !isDemoBooking(bookingUrl)),
    options: hidePrices
      ? []
      : offer.options.map((option) => ({
          ...option,
          paymentType:
            option.paymentType || (option.installmentCount > 1 ? 'installments' : 'full'),
          balanceCents: option.balanceCents || 0,
          totalCents: paymentTotal(option),
          paymentUrl:
            offer.provisional || requiresEdition
              ? null
              : option.method === 'calendly'
                ? safeBooking(option.paymentUrl, env)
                : option.paymentUrl,
          whatsappUrl: offer.provisional ? null : option.whatsappUrl,
          transferInstructions: offer.provisional ? null : option.transferInstructions,
        })),
  };
}
export function paymentTotal(
  option: Pick<PaymentOption, 'amountCents' | 'installmentCount' | 'depositCents'> & {
    balanceCents?: number;
  },
) {
  return (
    option.amountCents * option.installmentCount + option.depositCents + (option.balanceCents || 0)
  );
}
const relations = { services: true, options: true } as const;
const ordering = { id: 'ASC', options: { sortOrder: 'ASC', id: 'ASC' } } as const;
export async function findOffers(db: DataSource, service?: string, includeDrafts = false) {
  const rows = await db
    .getRepository(CommercialOffer)
    .find({ where: includeDrafts ? {} : { published: true }, relations, order: ordering });
  return service ? rows.filter((o) => o.services.some((s) => s.code === service)) : rows;
}
export async function saveEditionPaymentLinks(
  manager: EntityManager,
  editionId: number,
  links?: z.infer<typeof editionPaymentLinkSchema>[],
) {
  if (links === undefined) return;
  const options = links.length
    ? await manager.getRepository(PaymentOption).find({
        where: { id: In(links.map((l) => l.paymentOptionId)) },
        relations: { offer: { services: true } },
      })
    : [];
  for (const link of links) {
    const option = options.find((o) => o.id === link.paymentOptionId);
    if (
      !option ||
      !option.offer.services.some((s) => s.code === 'presencial') ||
      option.method === 'calendly'
    )
      throw new BadRequestException('La opción de pago no corresponde a una formación presencial.');
    if (option.method === 'stripe' && !stripeUrl.safeParse(link.url).success)
      throw new BadRequestException('Usa un enlace de Stripe para esta opción.');
  }
  await manager.getRepository(EditionPaymentLink).delete({ editionId });
  if (links.length)
    await manager.getRepository(EditionPaymentLink).save(links.map((l) => ({ ...l, editionId })));
}

@ApiTags('Ofertas públicas')
@Controller('offers')
export class PublicOffersController {
  constructor(@Inject(DataSource) private db: DataSource) {}
  @Get() async list(@Query('service') service?: string) {
    return (await findOffers(this.db, service)).map((o) => publicOffer(o));
  }
  @Get(':code') async get(@Param('code') code: string) {
    const offer = await this.db
      .getRepository(CommercialOffer)
      .findOne({ where: { code, published: true }, relations, order: ordering });
    if (!offer) throw new NotFoundException();
    return publicOffer(offer);
  }
}
@ApiTags('Administración de ofertas')
@ApiCookieAuth()
@UseGuards(SessionGuard)
@Controller('admin/offers')
export class AdminOffersController {
  constructor(@Inject(DataSource) private db: DataSource) {}
  @Get() async list() {
    return (await findOffers(this.db, undefined, true)).map((o) => ({
      ...o,
      serviceCodes: o.services.map((s) => s.code),
    }));
  }
  @Post() @ApiBody({ schema: apiSchema(offerSchema) }) create(@Body() body: unknown) {
    return this.save(parse(offerSchema, body));
  }
  @Patch(':id') @ApiBody({ schema: apiSchema(offerSchema) }) update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.save(parse(offerSchema, body), id);
  }
  private async save(values: OfferValues, id?: number) {
    return this.db.transaction(async (manager) => {
      const repo = manager.getRepository(CommercialOffer);
      const current = id
        ? await repo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } })
        : null;
      if (id && !current) throw new NotFoundException();
      if (current && values.code !== current.code)
        throw new BadRequestException('El código de una oferta existente no se cambia.');
      const duplicate = await repo.findOneBy({ code: values.code });
      if (duplicate && duplicate.id !== id)
        throw new BadRequestException('Ya existe una oferta con este código.');
      if (values.route && (await manager.getRepository(Service).existsBy({ route: values.route })))
        throw new BadRequestException('La ruta ya pertenece a un servicio.');
      const { options, serviceCodes, ...fields } = values;
      if (
        options.some((o) => o.paymentType === 'reservation') &&
        !serviceCodes.includes('presencial')
      )
        throw new BadRequestException(
          'La reserva con saldo al comenzar corresponde a una edición presencial.',
        );
      const services = await manager.getRepository(Service).findBy({ code: In(serviceCodes) });
      if (services.length !== serviceCodes.length)
        throw new BadRequestException('Selecciona servicios existentes.');
      const optionsRepo = manager.getRepository(PaymentOption);
      const existing = id ? await optionsRepo.findBy({ offerId: id }) : [];
      if (
        options.some(
          (o) =>
            o.id &&
            !o.paymentType &&
            existing.some((e) => e.id === o.id && e.paymentType === 'reservation'),
        )
      )
        throw new BadRequestException(
          'Actualiza el panel antes de editar una reserva con saldo pendiente.',
        );
      if (options.some((o) => o.id && !existing.some((e) => e.id === o.id)))
        throw new BadRequestException('Una opción de pago no pertenece a esta oferta.');
      const saved = await repo.save({ ...current, ...fields, services });
      const retained = new Set(options.map((o) => o.id));
      const removed = existing.filter((o) => !retained.has(o.id)).map((o) => o.id);
      if (removed.length) await optionsRepo.delete({ offerId: saved.id, id: In(removed) });
      if (options.length)
        await optionsRepo.save(
          options.map((o, sortOrder) => ({
            ...o,
            paymentType: o.paymentType || (o.installmentCount > 1 ? 'installments' : 'full'),
            offerId: saved.id,
            sortOrder,
          })),
        );
      const offer = await repo.findOneOrFail({
        where: { id: saved.id },
        relations,
        order: ordering,
      });
      return { ...offer, serviceCodes: offer.services.map((s) => s.code) };
    });
  }
  @Delete(':id') async remove(@Param('id', ParseIntPipe) id: number) {
    const repo = this.db.getRepository(CommercialOffer);
    if (!(await repo.existsBy({ id }))) throw new NotFoundException();
    await repo.delete(id);
    return { ok: true };
  }
}
