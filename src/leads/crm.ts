import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Lead } from '../database/entities';
export interface CrmReceipt {
  externalId: string;
}
export abstract class CrmAdapter {
  abstract upsertLead(lead: Lead): Promise<CrmReceipt>;
}
@Injectable()
export class DatabaseCrmAdapter implements CrmAdapter {
  constructor(@Inject(DataSource) private db: DataSource) {}
  async upsertLead(lead: Lead) {
    const record = await this.db.getRepository(Lead).findOneByOrFail({ id: lead.id });
    return { externalId: record.id };
  }
}
// Register another implementation under CrmAdapter when Airtable credentials are available.
// Lead persistence stays local; deliveries retry using the stable lead UUID as idempotency key.
