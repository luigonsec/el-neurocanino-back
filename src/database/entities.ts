import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
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
  @Column({ type: 'json' }) outcomes!: string[];
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
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn() id!: number;
  @Column() author!: string;
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
  @Column() email!: string;
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
export const entities = [Service, Edition, Review, Lead, Administrator, Session, Media, Delivery];
