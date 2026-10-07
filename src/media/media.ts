import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { Media } from '../database/entities';
import { config } from '../config';
import { SessionGuard } from '../auth/auth';
@ApiTags('Imágenes')
@ApiCookieAuth()
@UseGuards(SessionGuard)
@Controller('admin/media')
export class MediaController {
  constructor(@Inject(DataSource) private db: DataSource) {}
  @Get() list() {
    return this.db.getRepository(Media).find({ order: { createdAt: 'DESC' }, take: 200 });
  }
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Selecciona una imagen.');
    let result;
    try {
      const image = sharp(file.buffer, { limitInputPixels: 40000000 });
      const meta = await image.metadata();
      if (!['jpeg', 'png', 'webp'].includes(meta.format || '')) throw new Error();
      result = await image
        .rotate()
        .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer({ resolveWithObject: true });
    } catch {
      throw new BadRequestException('Usa una imagen JPEG, PNG o WebP válida de hasta 10 MB.');
    }
    const filename = randomUUID() + '.webp';
    await mkdir(config.UPLOAD_DIR, { recursive: true });
    const destination = path.join(config.UPLOAD_DIR, filename);
    await sharp(result.data).toFile(destination);
    try {
      return await this.db.getRepository(Media).save({
        path: `/media/${filename}`,
        originalName: path.basename(file.originalname).slice(0, 255),
        width: result.info.width,
        height: result.info.height,
      });
    } catch (error) {
      await unlink(destination);
      throw error;
    }
  }
}
