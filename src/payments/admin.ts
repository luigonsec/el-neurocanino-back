import { Controller, Get, Post, Param, Inject, UseGuards, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SessionGuard } from '../auth/auth';
import { PurchaseOrder, StripeEventRecord } from './entities';
@Controller('admin/purchases')
@UseGuards(SessionGuard)
export class AdminPurchasesController {
  constructor(@Inject(DataSource) private db: DataSource) {}
  @Get() async list() {
    const rows = await this.db
      .getRepository(PurchaseOrder)
      .find({ order: { createdAt: 'DESC' }, take: 100 });
    return rows.map(({ publicToken, requestKey, ...row }) => row);
  }
  @Get('events') events() {
    return this.db.getRepository(StripeEventRecord).find({
      where: { status: 'failed' },
      select: { id: true, status: true, attempts: true, lastError: true, createdAt: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
  @Post('events/:id/retry') async retry(@Param('id') id: string) {
    const result = await this.db
      .getRepository(StripeEventRecord)
      .update(
        { id, status: 'failed' },
        { status: 'pending', attempts: 0, lastError: null, nextAttemptAt: new Date() },
      );
    if (!result.affected) throw new NotFoundException();
    return { ok: true };
  }
}
