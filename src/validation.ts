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
  .max(255);
export const calendlyUrl = z.url().refine((u) => {
  const url = new URL(u);
  return url.protocol === 'https:' && url.hostname === 'calendly.com';
}, 'Usa una URL https://calendly.com/…');
export const externalUrl = z
  .url()
  .refine((u) => new URL(u).protocol === 'https:', 'La URL debe utilizar HTTPS.');
export const serviceOutcomeSchema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().trim().min(2).max(255),
  description: z.string().trim().max(4000),
});
export const serviceSchema = z
  .object({
    title: z.string().trim().min(2).max(255),
    label: z.string().trim().min(2).max(255),
    intro: z.string().trim().min(10).max(2000),
    description: z.string().trim().min(10).max(10000),
    outcomes: z
      .array(serviceOutcomeSchema)
      .max(20)
      .refine((points) => {
        const ids = points.flatMap((point) => (point.id ? [point.id] : []));
        return new Set(ids).size === ids.length;
      }, 'Un punto no puede aparecer dos veces.'),
    image: mediaPath,
    cardImage: mediaPath.nullish(),
    actionMode: z.enum(['contact', 'external', 'calendly']),
    actionUrl: optionalText(500),
    seoTitle: optionalText(),
    seoDescription: optionalText(500),
  })
  .superRefine((v, c) => {
    if (v.actionUrl) {
      const r = (v.actionMode === 'calendly' ? calendlyUrl : externalUrl).safeParse(v.actionUrl);
      if (!r.success)
        c.addIssue({ code: 'custom', path: ['actionUrl'], message: r.error.issues[0].message });
    }
  });
const date = z.iso.date();
export const editionSchema = z
  .object({
    title: z.string().trim().min(2).max(255),
    location: z.string().trim().min(2).max(255),
    city: z.string().trim().min(2).max(255),
    province: z.string().trim().min(2).max(255),
    status: z.enum(['open', 'closed']).default('open'),
    startDate: date,
    endDate: date,
    description: z.string().trim().min(10).max(10000),
    capacity: z.number().int().min(1).max(10000),
    placesAvailable: z.number().int().min(0),
    photos: z.array(mediaPath).max(12),
    calendlyUrl: calendlyUrl.nullish().transform((v) => v || null),
    paymentLinks: z
      .array(z.object({ paymentOptionId: z.number().int().positive(), url: externalUrl }))
      .max(24)
      .refine(
        (links) => new Set(links.map((link) => link.paymentOptionId)).size === links.length,
        'No repitas opciones de pago.',
      )
      .optional(),
    published: z.boolean(),
    isDemo: z.boolean(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    path: ['endDate'],
    message: 'La fecha final debe ser igual o posterior a la inicial.',
  })
  .refine((v) => v.placesAvailable <= v.capacity, {
    path: ['placesAvailable'],
    message: 'Las plazas disponibles no pueden superar el total.',
  });
export const reviewSchema = z.object({
  author: z.string().trim().min(2).max(255),
  text: z.string().trim().min(10).max(4000),
  rating: z.number().int().min(1).max(5),
  date: date.nullish().transform((v) => v || null),
  sourceUrl: externalUrl.nullish().transform((v) => v || null),
  sortOrder: z.number().int().min(0).max(10000),
  published: z.boolean(),
  isDemo: z.boolean(),
});
