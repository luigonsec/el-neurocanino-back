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
import { DataSource, MoreThanOrEqual } from 'typeorm';
import { Service, Edition, Review } from '../database/entities';
import { SessionGuard } from '../auth/auth';
import { config } from '../config';
import { privacyVersion } from '../privacy';
import { parse, apiSchema, serviceSchema, editionSchema, reviewSchema } from '../validation';
const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
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
  @Get('editions') editions() {
    return this.db.getRepository(Edition).find({
      where: {
        published: true,
        startDate: MoreThanOrEqual(today()),
        ...(config.APP_ENV === 'production' ? { isDemo: false } : {}),
      },
      order: { startDate: 'ASC' },
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
  @Get('editions') editions() {
    return this.db.getRepository(Edition).find({ order: { startDate: 'DESC' } });
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
    if (!(await r.existsBy({ id }))) throw new NotFoundException();
    await r.update(id, parse(editionSchema, body));
    return r.findOneByOrFail({ id });
  }
  @Delete('editions/:id') async deleteEdition(@Param('id', ParseIntPipe) id: number) {
    const r = this.db.getRepository(Edition);
    if (!(await r.existsBy({ id }))) throw new NotFoundException();
    await r.delete(id);
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
