import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config({ path: path.resolve(process.cwd(), '../.env'), quiet: true });
dotenv.config({ quiet: true });
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('neurocanino'),
  DB_PASSWORD: z.string().min(8),
  DB_NAME: z.string().default('neurocanino'),
  PUBLIC_ORIGIN: z.url().default('http://localhost:19080'),
  ADDITIONAL_PUBLIC_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.url())),
  CRM_PROVIDER: z.enum(['local']).default('local'),
  UPLOAD_DIR: z.string().default('./uploads'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  SMTP_FROM: z.string().default('El Neurocanino <web@localhost>'),
  NOTIFICATION_EMAIL: z.string().default(''),
  SEED_DEMO: z.enum(['true', 'false']).default('false'),
});
export const config = schema.parse(process.env);
if (
  config.APP_ENV === 'production' &&
  /change_me|local_|_dev|development_password/i.test(config.DB_PASSWORD)
)
  throw new Error('Configura una contraseña de base de datos de producción.');
if (config.APP_ENV === 'production' && !config.PUBLIC_ORIGIN.startsWith('https://'))
  throw new Error('PUBLIC_ORIGIN debe usar HTTPS en producción.');

export const allowedOrigins = new Set(
  [config.PUBLIC_ORIGIN, ...config.ADDITIONAL_PUBLIC_ORIGINS].map((url) => new URL(url).origin),
);
