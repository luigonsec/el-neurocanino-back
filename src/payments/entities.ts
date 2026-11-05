import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
export interface PurchaseSnapshot {
  code: string;
  title: string;
  route: string;
  optionId: number;
  optionLabel: string;
  amount: number;
  deposit: number;
  balance: number;
  count: number;
  total: number;
  kind: string;
  edition: {
    id: number;
    title: string;
    city: string;
    location: string;
    startDate: string;
    endDate: string;
  } | null;
}
@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryColumn({ length: 36 }) id!: string;
  @Index({ unique: true }) @Column({ name: 'request_key', length: 36 }) requestKey!: string;
  @Index({ unique: true }) @Column({ name: 'public_token', length: 64 }) publicToken!: string;
  @Column({ type: 'json' }) snapshot!: PurchaseSnapshot;
  @Column({ length: 24, default: 'pending' }) status!: string;
  @Column({ name: 'billing_status', length: 24, default: 'none' }) billingStatus!: string;
  @Column({ name: 'amount_paid', default: 0 }) amountPaid!: number;
  @Column({ name: 'paid_installments', default: 0 }) paidInstallments!: number;
  @Column({ name: 'is_test', default: true }) isTest!: boolean;
  @Column({ nullable: true, type: 'varchar' }) email!: string | null;
  @Column({ nullable: true, type: 'varchar' }) name!: string | null;
  @Column({ nullable: true, type: 'varchar', length: 40 }) phone!: string | null;
  @Index({ unique: true })
  @Column({ name: 'subscription_id', type: 'varchar', length: 255, nullable: true })
  subscriptionId!: string | null;
  @Column({ name: 'schedule_id', type: 'varchar', length: 255, nullable: true }) scheduleId!:
    | string
    | null;
  @Column({ name: 'lead_id', type: 'varchar', length: 36, nullable: true }) leadId!: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
@Entity('purchase_attempts')
export class PurchaseAttempt {
  @PrimaryColumn({ length: 36 }) id!: string;
  @Index() @Column({ name: 'order_id', length: 36 }) orderId!: string;
  @Index({ unique: true })
  @Column({ name: 'session_id', type: 'varchar', nullable: true })
  sessionId!: string | null;
  @Column({ type: 'text', nullable: true }) url!: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
}
@Entity('stripe_event_inbox')
export class StripeEventRecord {
  @PrimaryColumn() id!: string;
  @Column({ type: 'json' }) payload!: Record<string, any>;
  @Column({ length: 20, default: 'pending' }) status!: string;
  @Column({ default: 0 }) attempts!: number;
  @Column({ name: 'next_attempt_at', type: 'datetime' }) nextAttemptAt!: Date;
  @Column({ name: 'last_error', type: 'text', nullable: true }) lastError!: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
}
@Entity('purchase_receipts')
export class PurchaseReceipt {
  @PrimaryColumn() id!: string;
  @Index() @Column({ name: 'order_id', length: 36 }) orderId!: string;
  @Column() amount!: number;
  @Column({ name: 'is_installment', default: false }) isInstallment!: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
}
@Entity('stripe_catalog_bindings')
export class StripeCatalogBinding {
  @PrimaryColumn({ length: 120 }) fingerprint!: string;
  @Column({ name: 'price_id' }) priceId!: string;
  @Column({ name: 'product_id' }) productId!: string;
  @Column({ name: 'account_id' }) accountId!: string;
}
