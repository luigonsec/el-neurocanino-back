import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  Inject,
  Injectable,
  Post,
  Req,
  Res,
  UnauthorizedException,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { DataSource, MoreThan } from 'typeorm';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import * as argon2 from 'argon2';
import { Request, Response } from 'express';
import { z } from 'zod';
import { Administrator, Session } from '../database/entities';
import { parse, apiSchema } from '../validation';
import { config } from '../config';
export interface AuthRequest extends Request {
  adminSession: Session;
}
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const loginSchema = z.object({ email: z.email(), password: z.string().min(1).max(300) });
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(DataSource) private db: DataSource) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const token = req.cookies?.neuro_session;
    if (!token || typeof token !== 'string') throw new UnauthorizedException('Inicia sesión.');
    const session = await this.db
      .getRepository(Session)
      .findOneBy({ tokenHash: hash(token), expiresAt: MoreThan(new Date()) });
    if (!session) throw new UnauthorizedException('La sesión ha caducado.');
    req.adminSession = session;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const csrf = req.headers['x-csrf-token'];
      if (
        typeof csrf !== 'string' ||
        !/^[a-f0-9]{64}$/.test(csrf) ||
        !timingSafeEqual(Buffer.from(csrf), Buffer.from(session.csrfToken))
      )
        throw new ForbiddenException('La sesión no permite esta operación.');
    }
    return true;
  }
}
@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(@Inject(DataSource) private db: DataSource) {}
  @Post('login')
  @ApiBody({ schema: apiSchema(loginSchema) })
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const b = parse(loginSchema, body);
    const admin = await this.db
      .getRepository(Administrator)
      .findOneBy({ email: b.email.toLowerCase() });
    if (!admin || !(await argon2.verify(admin.passwordHash, b.password)))
      throw new UnauthorizedException('Email o contraseña incorrectos.');
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    const csrfToken = randomBytes(32).toString('hex');
    await this.db
      .getRepository(Session)
      .save({ tokenHash: hash(token), adminId: admin.id, csrfToken, expiresAt });
    res.cookie('neuro_session', token, {
      httpOnly: true,
      secure: new URL(config.PUBLIC_ORIGIN).protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });
    return { email: admin.email, csrfToken };
  }
  @Get('me') @ApiCookieAuth() @UseGuards(SessionGuard) async me(@Req() req: AuthRequest) {
    const a = await this.db
      .getRepository(Administrator)
      .findOneByOrFail({ id: req.adminSession.adminId });
    return { email: a.email, csrfToken: req.adminSession.csrfToken };
  }
  @Post('logout') @ApiCookieAuth() @UseGuards(SessionGuard) async logout(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.db.getRepository(Session).delete(req.adminSession.id);
    res.clearCookie('neuro_session', {
      path: '/',
      httpOnly: true,
      secure: new URL(config.PUBLIC_ORIGIN).protocol === 'https:',
      sameSite: 'lax',
    });
    return { ok: true };
  }
}
