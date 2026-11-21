import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
export function apiSchema(schema: z.ZodType): SchemaObject {
  const { $schema, ...json } = z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io: 'input',
    unrepresentable: 'any',
  });
  return json as SchemaObject;
}
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const r = schema.safeParse(value);
  if (!r.success)
    throw new BadRequestException({
      message: 'Revisa los campos indicados.',
      errors: r.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  return r.data;
}
export const optionalText = (max = 255) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);
export const mediaPath = z
  .string()
  .regex(/^\/(images|media)\/[a-zA-Z0-9_.\/-]+$/, 'Selecciona una imagen del proyecto.')
  .max(255)
  .refine((p) => !p.includes('..'));
export const calendlyUrl = z
  .url()
  .max(500)
  .refine((u) => {
    const v = new URL(u);
    return (
      v.protocol === 'https:' &&
      v.hostname === 'calendly.com' &&
      !v.username &&
      !v.password &&
      !v.port &&
      v.pathname.split('/').filter(Boolean).length >= 2
    );
  }, 'Usa el enlace HTTPS de un evento de Calendly.');
