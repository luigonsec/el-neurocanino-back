import 'reflect-metadata';
import { Controller, Get, Inject, Module, ServiceUnavailableException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import express from 'express';
import path from 'node:path';
import { config, allowedOrigins } from './config';
import { databaseOptions } from './database/source';
import { AuthController, SessionGuard } from './auth/auth';
import { AdminLeadsController, LeadsController } from './leads/leads';
import { DeliveryWorker } from './leads/deliveries';
import { EventsController, AdminEventsController } from './events/events';
import { PublicConfigController, AdminBookingsController } from './bookings/bookings';
import { MediaController } from './media/media';
@Controller('health')
class HealthController {
  constructor(@Inject(DataSource) private db: DataSource) {}
  @Get() async health() {
    try {
      await this.db.query('SELECT 1');
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Base de datos no disponible.');
    }
  }
}
@Module({
  imports: [TypeOrmModule.forRoot(databaseOptions)],
  controllers: [
    AuthController,
    PublicConfigController,
    AdminBookingsController,
    AdminLeadsController,
    LeadsController,
    EventsController,
    AdminEventsController,
    MediaController,
    HealthController,
  ],
  providers: [SessionGuard, DeliveryWorker],
})
class AppModule {}
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const server = app.getHttpAdapter().getInstance();
  server.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());
  app.use(express.json({ limit: '64kb' }));
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      req.headers.origin &&
      !allowedOrigins.has(req.headers.origin)
    )
      return res.status(403).json({ message: 'Origen no permitido.' });
    next();
  });
  const limiter = (limit: number) =>
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { message: 'Demasiados intentos. Espera unos minutos.' },
    });
  const eventLimiter = limiter(20);
  app.use('/api/v1/auth/login', limiter(10));
  app.use('/api/v1/contact', limiter(15));
  app.use('/api/v1/program-applications', limiter(30));
  app.use(
    '/api/v1/events',
    (req: express.Request, res: express.Response, next: express.NextFunction) =>
      req.method === 'POST' ? eventLimiter(req, res, next) : next(),
  );
  app.use(
    '/media',
    express.static(path.resolve(config.UPLOAD_DIR), {
      immutable: true,
      maxAge: '1y',
      dotfiles: 'deny',
      fallthrough: false,
    }),
  );
  app.setGlobalPrefix('api/v1');
  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('El Neurocanino API')
      .setDescription(
        'API pública y administración protegida. Escrituras privadas: cookie de sesión y cabecera X-CSRF-Token.',
      )
      .setVersion('1.0')
      .addCookieAuth('neuro_session')
      .build(),
  );
  SwaggerModule.setup('api/docs', app, doc);
  app.enableShutdownHooks();
  await app.listen(config.PORT, '0.0.0.0');
}
bootstrap().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
