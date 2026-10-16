import {
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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Service, Edition, Review, Lead } from '../database/entities';
import { SessionGuard } from '../auth/auth';
import { config } from '../config';
import { privacyVersion } from '../privacy';
import { parse, apiSchema, serviceSchema, editionSchema, reviewSchema } from '../validation';
import { editionStatus } from './edition-status';
@ApiTags('Contenido público')
@Controller()
export class PublicContentController {
  constructor(@Inject(DataSource) private db: DataSource) {}
  @Get('public-config') publicConfig() {
    return { privacyVersion };
  }
  @Get('services') listServices() {
    return this.db.getRepository(Service).find({ order: { id: 'ASC' } });
  }
  @Get('services/:code') async getService(@Param('code') code: string) {
    const s = await this.db.getRepository(Service).findOneBy({ code });
    if (!s) throw new NotFoundException();
    return s;
  }
  @Get('editions') async editions() {
    const editions = await this.db.getRepository(Edition).find({
      where: {
        published: true,
        ...(config.APP_ENV === 'production' ? { isDemo: false } : {}),
      },
      order: { startDate: 'ASC' },
    });
    return editions
      .map((e) => ({ ...e, status: editionStatus(e) }))
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'open' ? -1 : 1;
        return a.status === 'open'
          ? a.startDate.localeCompare(b.startDate)
          : b.endDate.localeCompare(a.endDate);
      });
  }
  @Get('reviews') reviews() {
    return this.db.getRepository(Review).find({
      where: { published: true, ...(config.APP_ENV === 'production' ? { isDemo: false } : {}) },
      order: { sortOrder: 'ASC', id: 'ASC' },
      take: 10,
    });
  }
}
@ApiTags('Administración de contenidos')
@ApiCookieAuth()
@UseGuards(SessionGuard)
@Controller('admin')
export class AdminContentController {
  constructor(@Inject(DataSource) private db: DataSource) {}
  @Get('services') services() {
    return this.db.getRepository(Service).find({ order: { id: 'ASC' } });
  }
  @Patch('services/:id')
  @ApiBody({ schema: apiSchema(serviceSchema) })
  async service(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const r = this.db.getRepository(Service);
    if (!(await r.existsBy({ id }))) throw new NotFoundException();
    await r.update(id, parse(serviceSchema, body));
    return r.findOneByOrFail({ id });
  }
  @Get('editions') async editions() {
    const editions = await this.db.getRepository(Edition).find({ order: { startDate: 'DESC' } });
    return editions.map((e) => ({ ...e, effectiveStatus: editionStatus(e) }));
  }
  @Post('editions') @ApiBody({ schema: apiSchema(editionSchema) }) createEdition(
    @Body() body: unknown,
  ) {
    return this.db.getRepository(Edition).save(parse(editionSchema, body));
  }
  @Patch('editions/:id') @ApiBody({ schema: apiSchema(editionSchema) }) async edition(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const r = this.db.getRepository(Edition);
    const current = await r.findOneBy({ id });
    if (!current) throw new NotFoundException();
    const values = parse(editionSchema, body);
    if (body && typeof body === 'object' && !('status' in body)) values.status = current.status;
    await r.update(id, values);
    return r.findOneByOrFail({ id });
  }
  @Delete('editions/:id') async deleteEdition(@Param('id', ParseIntPipe) id: number) {
    const r = this.db.getRepository(Edition);
    if (!(await r.existsBy({ id }))) throw new NotFoundException();
    await this.db.transaction(async (manager) => {
      // Preserve the request type before the foreign key is set to NULL on deletion.
      await manager
        .getRepository(Lead)
        .update({ editionId: id, kind: 'service' }, { kind: 'edition' });
      await manager.getRepository(Edition).delete(id);
    });
    return { ok: true };
  }
  @Get('reviews') reviews() {
    return this.db.getRepository(Review).find({ order: { sortOrder: 'ASC', id: 'ASC' } });
  }
  @Post('reviews') @ApiBody({ schema: apiSchema(reviewSchema) }) createReview(
    @Body() body: unknown,
  ) {
    return this.db.getRepository(Review).save(parse(reviewSchema, body));
  }
  @Patch('reviews/:id') @ApiBody({ schema: apiSchema(reviewSchema) }) async review(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const r = this.db.getRepository(Review);
    if (!(await r.existsBy({ id }))) throw new NotFoundException();
    await r.update(id, parse(reviewSchema, body));
    return r.findOneByOrFail({ id });
  }
  @Delete('reviews/:id') async deleteReview(@Param('id', ParseIntPipe) id: number) {
    await this.db.getRepository(Review).delete(id);
    return { ok: true };
  }
}
