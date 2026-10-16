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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Response } from 'express';
import { z } from 'zod';
import { Lead, Delivery, Edition } from '../database/entities';
import { parse, apiSchema } from '../validation';
import { leadSchema, regionSchema } from './schemas';
import { SessionGuard } from '../auth/auth';
import { config } from '../config';
import { editionStatus } from '../content/edition-status';
const statusSchema = z.object({ status: z.enum(['new', 'contacted', 'closed']) });
export function csvCell(value: unknown) {
  let s = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
@ApiTags('Solicitudes')
@Controller()
export class LeadsController {
  constructor(@Inject(DataSource) private db: DataSource) {}
  private async persist(values: Partial<Lead>) {
    return this.db.transaction(async (manager) => {
      const lead = await manager
        .getRepository(Lead)
        .save(manager.getRepository(Lead).create(values));
      await manager.getRepository(Delivery).save([
        {
          leadId: lead.id,
          channel: 'crm',
          status: 'pending',
          attempts: 0,
          nextAttemptAt: new Date(),
        },
        {
          leadId: lead.id,
          channel: 'email',
          status: 'pending',
          attempts: 0,
          nextAttemptAt: new Date(),
        },
      ]);
      return { id: lead.id, message: 'Hemos recibido tu solicitud. Te contactaremos pronto.' };
    });
  }
  @Post('leads')
  @ApiBody({ schema: apiSchema(leadSchema) })
  async create(@Body() body: unknown) {
    const { website, privacyAccepted, ...b } = parse(leadSchema, body);
    if (b.editionId) {
      const edition = await this.db.getRepository(Edition).findOneBy({
        id: b.editionId,
        published: true,
        ...(config.APP_ENV === 'production' ? { isDemo: false } : {}),
      });
      if (!edition || editionStatus(edition) === 'closed')
        throw new BadRequestException('La edición no está disponible.');
      if (b.serviceCode !== 'presencial')
        throw new BadRequestException('La edición pertenece al servicio de formación presencial.');
    }
    return this.persist({
      ...b,
      kind: b.editionId ? 'edition' : b.serviceCode ? 'service' : 'general',
    });
  }
  @Post('region-requests')
  @ApiBody({ schema: apiSchema(regionSchema) })
  async regional(@Body() body: unknown) {
    const { website, privacyAccepted, ...b } = parse(regionSchema, body);
    return this.persist({
      ...b,
      kind: 'regional',
      source: 'regional-form',
      serviceCode: 'presencial',
    });
  }
}
@ApiTags('Administración de solicitudes')
@ApiCookieAuth()
@UseGuards(SessionGuard)
@Controller('admin/leads')
export class AdminLeadsController {
  constructor(@Inject(DataSource) private db: DataSource) {}
  private builder(query: Record<string, string>) {
    const q = parse(
      z.object({
        category: z.enum(['general', 'service', 'edition', 'regional']).optional(),
        kind: z.enum(['general', 'service', 'edition', 'regional']).optional(),
        status: z.enum(['new', 'contacted', 'closed']).optional(),
        service: z.string().max(40).optional(),
        source: z.string().max(100).optional(),
        page: z.coerce.number().int().min(1).default(1),
      }),
      query,
    );
    const b = this.db
      .getRepository(Lead)
      .createQueryBuilder('lead')
      .orderBy('lead.createdAt', 'DESC');
    for (const [field, value] of Object.entries({
      kind: q.kind,
      status: q.status,
      serviceCode: q.service,
      source: q.source,
    }))
      if (value) b.andWhere(`lead.${field} = :${field}`, { [field]: value });
    if (q.category === 'edition') {
      // Include historical requests; their kind predates the separate edition category.
      b.andWhere(
        '(lead.kind = :editionKind OR (lead.kind = :serviceKind AND lead.editionId IS NOT NULL))',
        { editionKind: 'edition', serviceKind: 'service' },
      );
    } else if (q.category) {
      b.andWhere('lead.kind = :categoryKind', { categoryKind: q.category });
      if (q.category === 'service') b.andWhere('lead.editionId IS NULL');
    }
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
    res.type('text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="solicitudes.csv"');
    res.write(
      '\uFEFF' +
        [
          'ID',
          'Nombre',
          'Email',
          'Teléfono',
          'Ciudad',
          'Provincia',
          'Mensaje',
          'Tipo',
          'Origen',
          'Servicio',
          'Edición',
          'Fechas propuestas',
          'Interesados',
          'Estado',
          'Fecha',
          'Versión privacidad',
        ]
          .map(csvCell)
          .join(',') +
        '\r\n',
    );
    const stream = await b.stream();
    for await (const v of stream) {
      res.write(
        [
          v.lead_id,
          v.lead_name,
          v.lead_email,
          v.lead_phone,
          v.lead_city,
          v.lead_province,
          v.lead_message,
          v.lead_kind,
          v.lead_source,
          v.lead_service_code,
          v.lead_edition_id,
          v.lead_suggested_dates,
          v.lead_interested_count,
          v.lead_status,
          v.lead_created_at,
          v.lead_privacy_version,
        ]
          .map(csvCell)
          .join(',') + '\r\n',
      );
    }
    res.end();
  }
  @Get(':id') async detail(@Param('id', new ParseUUIDPipe()) id: string) {
    const lead = await this.db.getRepository(Lead).findOneBy({ id });
    if (!lead) throw new NotFoundException();
    return {
      ...lead,
      deliveries: await this.db
        .getRepository(Delivery)
        .find({ where: { leadId: id }, order: { id: 'ASC' } }),
    };
  }
  @Patch(':id')
  @ApiBody({ schema: apiSchema(statusSchema) })
  async status(@Param('id', new ParseUUIDPipe()) id: string, @Body() body: unknown) {
    const b = parse(statusSchema, body);
    const r = await this.db.getRepository(Lead).update(id, b);
    if (!r.affected) throw new NotFoundException();
    return { ok: true };
  }
  @Post(':id/retry') async retry(@Param('id', new ParseUUIDPipe()) id: string) {
    if (!(await this.db.getRepository(Lead).existsBy({ id }))) throw new NotFoundException();
    await this.db
      .getRepository(Delivery)
      .createQueryBuilder()
      .update()
      .set({ status: 'pending', attempts: 0, nextAttemptAt: new Date() })
      .where('lead_id = :id AND status != :sent', { id, sent: 'sent' })
      .execute();
    return { ok: true };
  }
}
