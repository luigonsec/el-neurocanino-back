import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  ConflictException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Response } from 'express';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { Lead, Delivery, BookingLink } from '../database/entities';
import { SessionGuard } from '../auth/auth';
import { parse } from '../validation';
import { applicationSchema, contactSchema, qualification } from './schemas';
import { leadNotification } from '../emails/notifications';
import { queueEmail } from './deliveries';
import { config } from '../config';
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export function csvCell(value: unknown) {
  let s = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
export function csvResponse(res: Response, name: string, rows: unknown[][]) {
  res
    .type('text/csv; charset=utf-8')
    .setHeader('Content-Disposition', `attachment; filename="${name}.csv"`);
  res.send('\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n'));
}
@Controller()
export class LeadsController {
  constructor(@Inject(DataSource) private db: DataSource) {}
  private async persist(key: string, input: Partial<Lead>) {
    const submissionHash = hash(`${input.category}:${key}`);
    const requestHash = hash(JSON.stringify(input));
    const result = await this.db.transaction(async (manager) => {
      const repo = manager.getRepository(Lead);
      // The unique key serializes concurrent retries; only the winning insert queues mail.
      const insert = await repo
        .createQueryBuilder()
        .insert()
        .values({ ...input, submissionHash, requestHash })
        .orIgnore()
        .execute();
      const lead = await repo
        .createQueryBuilder('lead')
        .addSelect('lead.requestHash')
        .where('lead.submissionHash = :submissionHash', { submissionHash })
        .getOneOrFail();
      if (lead.requestHash !== requestHash)
        throw new ConflictException(
          'Esta solicitud ya se envió con otros datos. Recarga para enviar una nueva.',
        );
      if (insert.raw.affectedRows === 1)
        await queueEmail(manager, `lead:${lead.id}`, leadNotification(lead, config.PUBLIC_ORIGIN), {
          leadId: lead.id,
        });
      return lead;
    });
    const booking =
      result.outcome && result.outcome !== 'community'
        ? await this.db.getRepository(BookingLink).findOneBy({ code: result.outcome })
        : null;
    return {
      id: result.id,
      outcome: result.outcome,
      ...(booking ? { bookingUrl: booking.url } : {}),
      ...(result.outcome === 'community' ? { communityUrl: '/servicios/comunidad/' } : {}),
      message: 'Hemos recibido tu solicitud.',
    };
  }
  @Post('program-applications') async application(@Body() body: unknown) {
    const b = parse(applicationSchema, body);
    return this.persist(b.submissionKey, {
      category: b.program,
      name: b.name,
      phone: b.phone,
      email: b.email,
      answers: b.answers,
      outcome: qualification(b),
      privacyVersion: b.privacyVersion,
    });
  }
  @Post('contact') async contact(@Body() body: unknown) {
    const b = parse(contactSchema, body);
    return this.persist(b.submissionKey, {
      category: 'contact',
      name: b.name,
      email: b.email,
      phone: b.phone || null,
      city: b.city,
      message: b.message,
      privacyVersion: b.privacyVersion,
    });
  }
}
@Controller('admin/leads')
@UseGuards(SessionGuard)
export class AdminLeadsController {
  constructor(@Inject(DataSource) private db: DataSource) {}
  private builder(query: Record<string, string>) {
    const q = parse(
      z.object({
        category: z.enum(['online', 'complete', 'contact']),
        status: z.enum(['new', 'contacted', 'closed']).optional(),
        budget: z.enum(['low', 'medium', 'high']).optional(),
        search: z.string().trim().max(120).optional(),
        page: z.coerce.number().int().min(1).default(1),
      }),
      query,
    );
    const b = this.db
      .getRepository(Lead)
      .createQueryBuilder('lead')
      .where('lead.category = :category', q)
      .orderBy('lead.createdAt', 'DESC');
    if (q.status) b.andWhere('lead.status = :status', q);
    if (q.budget) b.andWhere("JSON_UNQUOTE(JSON_EXTRACT(lead.answers, '$.budget')) = :budget", q);
    if (q.search)
      b.andWhere('(lead.name LIKE :search OR lead.email LIKE :search OR lead.phone LIKE :search)', {
        search: `%${q.search}%`,
      });
    return { b, page: q.page };
  }
  @Get() async list(@Query() query: Record<string, string>) {
    const { b, page } = this.builder(query);
    const [items, total] = await b
      .skip((page - 1) * 25)
      .take(25)
      .getManyAndCount();
    return { items, total, page, pageSize: 25 };
  }
  @Get('export.csv') async export(@Query() query: Record<string, string>, @Res() res: Response) {
    const { b } = this.builder(query);
    const leads = await b.getMany();
    csvResponse(res, 'solicitudes', [
      [
        'ID',
        'Origen',
        'Nombre',
        'Email',
        'Teléfono',
        'Ciudad',
        'Mensaje',
        'Estado',
        'Resultado',
        'Fecha',
        'Privacidad',
        'Respuestas',
      ],
      ...leads.map((l) => [
        l.id,
        l.category,
        l.name,
        l.email,
        l.phone,
        l.city,
        l.message,
        l.status,
        l.outcome,
        l.createdAt.toISOString(),
        l.privacyVersion,
        JSON.stringify(l.answers),
      ]),
    ]);
  }
  @Get(':id') async detail(@Param('id', new ParseUUIDPipe()) id: string) {
    const lead = await this.db.getRepository(Lead).findOneBy({ id });
    if (!lead) throw new NotFoundException();
    return {
      ...lead,
      deliveries: await this.db
        .getRepository(Delivery)
        .find({
          where: { leadId: id },
          select: { id: true, status: true, attempts: true, lastError: true, subject: true },
        }),
    };
  }
  @Patch(':id') async update(@Param('id', new ParseUUIDPipe()) id: string, @Body() body: unknown) {
    const b = parse(z.object({ status: z.enum(['new', 'contacted', 'closed']) }).strict(), body);
    if (!(await this.db.getRepository(Lead).update(id, b)).affected) throw new NotFoundException();
    return { ok: true };
  }
  @Post(':id/retry') async retry(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.db
      .getRepository(Delivery)
      .createQueryBuilder()
      .update()
      .set({ status: 'pending', attempts: 0, nextAttemptAt: new Date(), lastError: null })
      .where('leadId = :id AND status = :status', { id, status: 'failed' })
      .execute();
    return { ok: true };
  }
}
