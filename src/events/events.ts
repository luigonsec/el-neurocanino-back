import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Delete,
  Res,
  UseGuards,
} from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { Response } from 'express';
import { z } from 'zod';
import { TrainingEvent, EventRegistration, Delivery } from '../database/entities';
import { SessionGuard } from '../auth/auth';
import { identity, phone } from '../leads/schemas';
import { parse, mediaPath, optionalText } from '../validation';
import { hash, csvResponse } from '../leads/leads';
import { queueEmail } from '../leads/deliveries';
import { eventNotification, eventStatusEmail } from '../emails/notifications';
import { config } from '../config';
export const eventSchema = z
  .object({
    title: z.string().trim().min(2).max(255),
    description: z.string().trim().min(10).max(10000),
    location: z.string().trim().min(2).max(255),
    city: z.string().trim().min(2).max(255),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    image: mediaPath.nullish().transform((v) => v || null),
    capacity: z.number().int().min(1).max(10000),
    published: z.boolean(),
    status: z.enum(['open', 'closed', 'cancelled']),
  })
  .strict()
  .refine((v) => v.endDate >= v.startDate, {
    path: ['endDate'],
    message: 'La fecha final no puede ser anterior a la inicial.',
  });
export const registrationSchema = z
  .object({ ...identity, phone, comment: optionalText(1000) })
  .strict();
export function madridToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function eventAvailability(
  event: Pick<TrainingEvent, 'endDate' | 'status' | 'published' | 'capacity'>,
  accepted: number,
  today = madridToday(),
) {
  const available = Math.max(0, event.capacity - accepted);
  return {
    placesAvailable: available,
    registrationOpen:
      event.published && event.status === 'open' && event.endDate >= today && available > 0,
  };
}
async function decoratedEvents(manager: EntityManager, events: TrainingEvent[]) {
  if (!events.length) return [];
  const counts = await manager
    .getRepository(EventRegistration)
    .createQueryBuilder('r')
    .select('r.eventId', 'eventId')
    .addSelect('r.status', 'status')
    .addSelect('COUNT(*)', 'count')
    .where('r.eventId IN (:...ids)', { ids: events.map((e) => e.id) })
    .groupBy('r.eventId')
    .addGroupBy('r.status')
    .getRawMany();
  return events.map((event) => {
    const accepted = Number(
      counts.find((c) => Number(c.eventId) === event.id && c.status === 'accepted')?.count || 0,
    );
    const pending = Number(
      counts.find((c) => Number(c.eventId) === event.id && c.status === 'pending')?.count || 0,
    );
    return { ...event, ...eventAvailability(event, accepted), accepted, pending };
  });
}
@Controller('events')
export class EventsController {
  constructor(@Inject(DataSource) private db: DataSource) {}
  @Get() async list() {
    const events = await this.db
      .getRepository(TrainingEvent)
      .createQueryBuilder('event')
      .where('event.published = true AND event.endDate >= :today AND event.status != :cancelled', {
        today: madridToday(),
        cancelled: 'cancelled',
      })
      .orderBy('event.startDate', 'ASC')
      .getMany();
    return (await decoratedEvents(this.db.manager, events)).map(
      ({ accepted, pending, ...event }) => event,
    );
  }
  @Post(':id/registrations') async register(
    @Param('id', ParseIntPipe) eventId: number,
    @Body() body: unknown,
  ) {
    const b = parse(registrationSchema, body);
    const submissionHash = hash(`event:${eventId}:${b.submissionKey}`);
    const { submissionKey, website, privacyAccepted, ...values } = b;
    const requestHash = hash(JSON.stringify(values));
    return this.db.transaction(async (manager) => {
      const event = await manager
        .getRepository(TrainingEvent)
        .findOne({ where: { id: eventId }, lock: { mode: 'pessimistic_write' } });
      if (!event) throw new NotFoundException();
      const repo = manager.getRepository(EventRegistration);
      const previous = await repo
        .createQueryBuilder('r')
        .addSelect('r.requestHash')
        .where('r.submissionHash = :submissionHash', { submissionHash })
        .getOne();
      if (previous) {
        if (previous.requestHash !== requestHash)
          throw new ConflictException('Esta solicitud ya se envió con otros datos.');
        return {
          id: previous.id,
          status: previous.status,
          message: 'Tu solicitud ya está registrada.',
        };
      }
      const accepted = await repo.countBy({ eventId, status: 'accepted' });
      if (!eventAvailability(event, accepted).registrationOpen)
        throw new BadRequestException('Este evento no admite nuevas solicitudes.');
      if (await repo.existsBy({ eventId, email: b.email }))
        throw new ConflictException(
          'Ya hemos recibido una solicitud con este email para este evento. Contacta con nosotros si necesitas modificarla.',
        );
      const registration = await repo.save(
        repo.create({ ...values, eventId, submissionHash, requestHash }),
      );
      await queueEmail(
        manager,
        `event:${registration.id}:internal`,
        eventNotification(registration, event, config.PUBLIC_ORIGIN),
        { registrationId: registration.id },
      );
      await queueEmail(
        manager,
        `event:${registration.id}:0`,
        eventStatusEmail(registration, event, 'pending'),
        { registrationId: registration.id, recipient: registration.email },
      );
      return {
        id: registration.id,
        status: 'pending',
        message:
          'Hemos recibido tu solicitud. Recibirás un correo cuando revisemos tu inscripción. Todavía no tienes una plaza confirmada.',
      };
    });
  }
}
@Controller('admin/events')
@UseGuards(SessionGuard)
export class AdminEventsController {
  constructor(@Inject(DataSource) private db: DataSource) {}
  @Get() async list() {
    return decoratedEvents(
      this.db.manager,
      await this.db.getRepository(TrainingEvent).find({ order: { startDate: 'DESC' } }),
    );
  }
  @Post() async create(@Body() body: unknown) {
    return this.db.getRepository(TrainingEvent).save(parse(eventSchema, body));
  }
  @Patch(':id') async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const values = parse(eventSchema, body);
    return this.db.transaction(async (manager) => {
      const repo = manager.getRepository(TrainingEvent);
      const event = await repo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!event) throw new NotFoundException();
      if (event.status === 'cancelled' && values.status !== 'cancelled')
        throw new BadRequestException(
          'Un evento cancelado no se puede reabrir. Crea una nueva convocatoria.',
        );
      const registrations = manager.getRepository(EventRegistration);
      if (values.capacity < (await registrations.countBy({ eventId: id, status: 'accepted' })))
        throw new BadRequestException(
          'El aforo no puede ser inferior al número de plazas confirmadas.',
        );
      Object.assign(event, values);
      await repo.save(event);
      if (values.status === 'cancelled') {
        const affected = await registrations.findBy({
          eventId: id,
          status: In(['pending', 'accepted']),
        });
        for (const registration of affected) {
          registration.status = 'cancelled';
          registration.revision++;
          await registrations.save(registration);
          await queueEmail(
            manager,
            `event:${registration.id}:${registration.revision}`,
            eventStatusEmail(registration, event, 'cancelled'),
            { registrationId: registration.id, recipient: registration.email },
          );
        }
      }
      return event;
    });
  }
  @Delete(':id') async remove(@Param('id', ParseIntPipe) id: number) {
    return this.db.transaction(async (manager) => {
      const event = await manager
        .getRepository(TrainingEvent)
        .findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!event) throw new NotFoundException();
      if (await manager.getRepository(EventRegistration).existsBy({ eventId: id }))
        throw new BadRequestException(
          'Este evento tiene solicitudes. Puedes cancelarlo para conservar su historial.',
        );
      await manager.getRepository(TrainingEvent).delete(id);
      return { ok: true };
    });
  }
  @Get(':id/registrations') async registrations(@Param('id', ParseIntPipe) eventId: number) {
    const event = await this.db.getRepository(TrainingEvent).findOneBy({ id: eventId });
    if (!event) throw new NotFoundException();
    const registrations = await this.db
      .getRepository(EventRegistration)
      .find({ where: { eventId }, order: { createdAt: 'DESC' } });
    const ids = registrations.map((r) => r.id);
    const deliveries = ids.length
      ? await this.db
          .getRepository(Delivery)
          .find({
            where: { registrationId: In(ids) },
            select: {
              id: true,
              registrationId: true,
              status: true,
              subject: true,
              attempts: true,
              lastError: true,
            },
          })
      : [];
    return {
      event: (await decoratedEvents(this.db.manager, [event]))[0],
      items: registrations.map((r) => ({
        ...r,
        deliveries: deliveries.filter((d) => d.registrationId === r.id),
      })),
    };
  }
  @Get(':id/registrations/export.csv') async export(
    @Param('id', ParseIntPipe) eventId: number,
    @Res() res: Response,
  ) {
    const entries = await this.db
      .getRepository(EventRegistration)
      .find({ where: { eventId }, order: { createdAt: 'DESC' } });
    csvResponse(res, `evento-${eventId}`, [
      ['Nombre', 'Email', 'Teléfono', 'Comentario', 'Estado', 'Fecha', 'Privacidad'],
      ...entries.map((r) => [
        r.name,
        r.email,
        r.phone,
        r.comment,
        r.status,
        r.createdAt.toISOString(),
        r.privacyVersion,
      ]),
    ]);
  }
  @Patch(':id/registrations/:registrationId') async status(
    @Param('id', ParseIntPipe) eventId: number,
    @Param('registrationId', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
  ) {
    const b = parse(
      z.object({ status: z.enum(['accepted', 'rejected', 'cancelled']) }).strict(),
      body,
    );
    return this.db.transaction(async (manager) => {
      const event = await manager
        .getRepository(TrainingEvent)
        .findOne({ where: { id: eventId }, lock: { mode: 'pessimistic_write' } });
      if (!event) throw new NotFoundException();
      const repo = manager.getRepository(EventRegistration);
      const registration = await repo.findOneBy({ id, eventId });
      if (!registration) throw new NotFoundException();
      if (registration.status === b.status) return { ok: true };
      if (event.status === 'cancelled') throw new BadRequestException('El evento está cancelado.');
      if (b.status === 'accepted') {
        const accepted = await repo.countBy({ eventId, status: 'accepted' });
        if (!eventAvailability(event, accepted).registrationOpen)
          throw new BadRequestException(
            'No se puede confirmar la plaza: revisa el aforo, la publicación y el estado del evento.',
          );
      }
      registration.status = b.status;
      registration.revision++;
      await repo.save(registration);
      await queueEmail(
        manager,
        `event:${id}:${registration.revision}`,
        eventStatusEmail(registration, event, b.status),
        { registrationId: id, recipient: registration.email },
      );
      return { ok: true };
    });
  }
  @Post(':id/registrations/:registrationId/retry') async retry(
    @Param('id', ParseIntPipe) eventId: number,
    @Param('registrationId', new ParseUUIDPipe()) id: string,
  ) {
    if (!(await this.db.getRepository(EventRegistration).existsBy({ id, eventId })))
      throw new NotFoundException();
    await this.db
      .getRepository(Delivery)
      .createQueryBuilder()
      .update()
      .set({ status: 'pending', attempts: 0, nextAttemptAt: new Date(), lastError: null })
      .where('registrationId = :id AND status = :status', { id, status: 'failed' })
      .execute();
    return { ok: true };
  }
}
