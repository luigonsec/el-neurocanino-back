import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
@Entity('services')
export class Service {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ unique: true, length: 40 }) code!: string;
  @Column({ unique: true, length: 255 }) route!: string;
  @Column() title!: string;
  @Column() label!: string;
  @Column({ type: 'text' }) intro!: string;
  @Column({ type: 'text' }) description!: string;
  @OneToMany(() => ServiceOutcome, (outcome) => outcome.service) outcomes!: ServiceOutcome[];
  @Column() image!: string;
  @Column({ name: 'card_image', type: 'varchar', length: 255, nullable: true }) cardImage!:
    | string
    | null;
  @Column({ name: 'action_mode', default: 'contact', length: 20 }) actionMode!: string;
  @Column({ name: 'action_url', type: 'varchar', length: 500, nullable: true }) actionUrl!:
    | string
    | null;
  @Column({ name: 'seo_title', type: 'varchar', nullable: true }) seoTitle!: string | null;
  @Column({ name: 'seo_description', type: 'text', nullable: true }) seoDescription!: string | null;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
@Entity('service_outcomes')
@Index(['serviceId', 'sortOrder'])
export class ServiceOutcome {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ name: 'service_id' }) serviceId!: number;
  @ManyToOne(() => Service, (service) => service.outcomes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service!: Service;
  @Column({ length: 255 }) title!: string;
  @Column({ type: 'text' }) description!: string;
  @Column({ name: 'sort_order', default: 0 }) sortOrder!: number;
}
@Entity('editions')
export class Edition {
  @PrimaryGeneratedColumn() id!: number;
  @Column() title!: string;
  @Column() location!: string;
  @Column() city!: string;
  @Column() province!: string;
  @Column({ type: 'varchar', length: 20, default: 'open' }) status!: 'open' | 'closed';
  @Column({ name: 'start_date', type: 'date' }) startDate!: string;
  @Column({ name: 'end_date', type: 'date' }) endDate!: string;
  @Column({ type: 'text' }) description!: string;
  @Column() capacity!: number;
  @Column({ name: 'places_available' }) placesAvailable!: number;
  @Column({ type: 'json' }) photos!: string[];
  @Column({ name: 'calendly_url', type: 'varchar', length: 500, nullable: true }) calendlyUrl!:
    | string
    | null;
  @Column({ default: false }) published!: boolean;
  @Column({ name: 'is_demo', default: false }) isDemo!: boolean;
  @OneToMany(() => EditionPaymentLink, (link) => link.edition) paymentLinks!: EditionPaymentLink[];
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
@Entity('commercial_offers')
export class CommercialOffer {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ unique: true, length: 60 }) code!: string;
  @Column() title!: string;
  @Column({ type: 'text' }) description!: string;
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true }) route!: string | null;
  @Column({ name: 'booking_url', type: 'varchar', length: 500, nullable: true }) bookingUrl!:
    | string
    | null;
  @Column({ name: 'seo_title', type: 'varchar', length: 255, nullable: true }) seoTitle!:
    | string
    | null;
  @Column({ name: 'seo_description', type: 'text', nullable: true }) seoDescription!: string | null;
  @Column({ default: false }) provisional!: boolean;
  @Column({ default: true }) published!: boolean;
  @Column({ name: 'klarna_enabled', default: false }) klarnaEnabled!: boolean;
  @ManyToMany(() => Service)
  @JoinTable({
    name: 'offer_services',
    joinColumn: { name: 'offer_id' },
    inverseJoinColumn: { name: 'service_id' },
  })
  services!: Service[];
  @OneToMany(() => PaymentOption, (option) => option.offer) options!: PaymentOption[];
}
@Entity('payment_options')
export class PaymentOption {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ name: 'offer_id' }) offerId!: number;
  @ManyToOne(() => CommercialOffer, (offer) => offer.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offer_id' })
  offer!: CommercialOffer;
  @Column() label!: string;
  @Column({ length: 20 }) method!: 'stripe' | 'transfer' | 'calendly';
  @Column({ length: 3, default: 'EUR' }) currency!: string;
  @Column({ name: 'amount_cents' }) amountCents!: number;
  @Column({ name: 'installment_count', default: 1 }) installmentCount!: number;
  @Column({ name: 'deposit_cents', default: 0 }) depositCents!: number;
  @Column({ name: 'payment_url', type: 'varchar', length: 500, nullable: true }) paymentUrl!:
    | string
    | null;
  @Column({ name: 'transfer_instructions', type: 'text', nullable: true }) transferInstructions!:
    | string
    | null;
  @Column({ name: 'whatsapp_url', type: 'varchar', length: 500, nullable: true }) whatsappUrl!:
    | string
    | null;
  @Column({ name: 'sort_order', default: 0 }) sortOrder!: number;
}
@Entity('edition_payment_links')
@Index(['editionId', 'paymentOptionId'], { unique: true })
export class EditionPaymentLink {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ name: 'edition_id' }) editionId!: number;
  @ManyToOne(() => Edition, (edition) => edition.paymentLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'edition_id' })
  edition!: Edition;
  @Column({ name: 'payment_option_id' }) paymentOptionId!: number;
  @ManyToOne(() => PaymentOption, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_option_id' })
  option!: PaymentOption;
  @Column({ length: 500 }) url!: string;
}
@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn() id!: number;
  @Column() author!: string;
  @Column({ name: 'photo_path', type: 'varchar', length: 255, nullable: true }) photoPath!:
    | string
    | null;
  @Column({ name: 'author_url', type: 'varchar', length: 500, nullable: true }) authorUrl!:
    | string
    | null;
  @Column({ type: 'text' }) text!: string;
  @Column() rating!: number;
  @Column({ type: 'date', nullable: true }) date!: string | null;
  @Column({ name: 'source_url', type: 'varchar', length: 500, nullable: true }) sourceUrl!:
    | string
    | null;
  @Column({ name: 'sort_order', default: 0 }) sortOrder!: number;
  @Column({ default: false }) published!: boolean;
  @Column({ name: 'is_demo', default: false }) isDemo!: boolean;
}
@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() name!: string;
  @Column({ type: 'varchar', nullable: true }) email!: string | null;
  @Column({
    name: 'quiz_token_hash',
    type: 'varchar',
    length: 64,
    nullable: true,
    unique: true,
    select: false,
  })
  quizTokenHash!: string | null;
  @Column({ type: 'varchar', nullable: true, length: 40 }) phone!: string | null;
  @Column({ type: 'varchar', nullable: true }) city!: string | null;
  @Column({ type: 'varchar', nullable: true }) province!: string | null;
  @Column({ type: 'text' }) message!: string;
  @Column({ length: 30 }) kind!: string;
  @Column({ length: 100 }) source!: string;
  @Column({ name: 'service_code', type: 'varchar', length: 40, nullable: true }) serviceCode!:
    | string
    | null;
  @Column({ name: 'edition_id', type: 'int', nullable: true }) editionId!: number | null;
  @Column({ name: 'suggested_dates', type: 'varchar', nullable: true }) suggestedDates!:
    | string
    | null;
  @Column({ name: 'interested_count', type: 'int', nullable: true }) interestedCount!:
    | number
    | null;
  @Column({ name: 'quiz_context', type: 'json', nullable: true }) quizContext!: Record<
    string,
    string
  > | null;
  @Column({ name: 'privacy_version', length: 30 }) privacyVersion!: string;
  @Column({ length: 30, default: 'new' }) status!: string;
  @Index() @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
}
@Entity('administrators')
export class Administrator {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ unique: true }) email!: string;
  @Column({ name: 'password_hash' }) passwordHash!: string;
}
@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ name: 'token_hash', unique: true, length: 64 }) tokenHash!: string;
  @Column({ name: 'admin_id' }) adminId!: number;
  @Column({ name: 'csrf_token', length: 64 }) csrfToken!: string;
  @Column({ name: 'expires_at', type: 'datetime' }) expiresAt!: Date;
}
@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() path!: string;
  @Column({ name: 'original_name' }) originalName!: string;
  @Column() width!: number;
  @Column() height!: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
}
@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ name: 'lead_id', length: 36 }) leadId!: string;
  @Column({ length: 20 }) channel!: string;
  @Column({ length: 20, default: 'pending' }) status!: string;
  @Column({ default: 0 }) attempts!: number;
  @Column({ name: 'next_attempt_at', type: 'datetime' }) nextAttemptAt!: Date;
  @Column({ name: 'last_error', type: 'text', nullable: true }) lastError!: string | null;
}
export const entities = [
  CommercialOffer,
  PaymentOption,
  EditionPaymentLink,
  Service,
  ServiceOutcome,
  Edition,
  Review,
  Lead,
  Administrator,
  Session,
  Media,
  Delivery,
];
