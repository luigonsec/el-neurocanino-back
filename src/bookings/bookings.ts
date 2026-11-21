import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { z } from 'zod';
import { SessionGuard } from '../auth/auth';
import { BookingLink } from '../database/entities';
import { calendlyUrl, parse } from '../validation';
import { privacyVersion } from '../privacy';
export const bookingDefaults = {
  online: 'https://calendly.com/adiestracaninos/asesoramiento-personalizado',
  complete: 'https://calendly.com/adiestracaninos/asesoramiento-personalizado',
  individual: 'https://calendly.com/adiestracaninos/sesion-de-seguimiento',
  intensive: 'https://calendly.com/adiestracaninos/sesion-intensiva',
  integral: 'https://calendly.com/adiestracaninos/sesion-de-seguimiento',
} as const;
export const bookingNames: Record<string, string> = {
  online: 'Programa online',
  complete: 'Programa completo',
  individual: 'Sesión individual (1 h)',
  intensive: 'Sesión intensiva (3 h)',
  integral: 'Servicio integral',
};
@Controller()
export class PublicConfigController {
  constructor(@Inject(DataSource) private db: DataSource) {}
  @Get('public-config') config() {
    return { privacyVersion };
  }
  @Get('booking-links') async links() {
    // Programme calendars are only returned after a qualified, persisted application.
    return this.db
      .getRepository(BookingLink)
      .find({
        where: { code: In(['individual', 'intensive', 'integral']) },
        select: { code: true, url: true },
      });
  }
}
@Controller('admin/booking-links')
@UseGuards(SessionGuard)
export class AdminBookingsController {
  constructor(@Inject(DataSource) private db: DataSource) {}
  @Get() async list() {
    return (await this.db.getRepository(BookingLink).find()).map((row) => ({
      ...row,
      title: bookingNames[row.code],
    }));
  }
  @Patch(':code') async update(@Param('code') code: string, @Body() body: unknown) {
    if (!Object.hasOwn(bookingDefaults, code)) throw new NotFoundException();
    const values = parse(z.object({ url: calendlyUrl }).strict(), body);
    await this.db.getRepository(BookingLink).update(code, values);
    return { ok: true };
  }
}
