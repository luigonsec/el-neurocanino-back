import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type LeadCategory = 'online' | 'complete' | 'contact';
export type LeadStatus = 'new' | 'contacted' | 'closed';
export type ApplicationOutcome = 'online' | 'complete' | 'community';
export type RegistrationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

@Entity('program_leads')
@Index(['category', 'createdAt'])
export class Lead {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 64, unique: true, select: false }) submissionHash!: string;
  @Column({ length: 64, select: false }) requestHash!: string;
  @Column({ length: 20 }) category!: LeadCategory;
  @Column({ length: 120 }) name!: string;
  @Column() email!: string;
  @Column({ type: 'varchar', length: 40, nullable: true }) phone!: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) city!: string | null;
  @Column({ type: 'text', nullable: true }) message!: string | null;
  @Column({ type: 'json', nullable: true }) answers!: Record<string, string> | null;
  @Column({ type: 'varchar', length: 20, nullable: true }) outcome!: ApplicationOutcome | null;
  @Column({ length: 20, default: 'new' }) status!: LeadStatus;
  @Column({ length: 30 }) privacyVersion!: string;
  @CreateDateColumn() createdAt!: Date;
}
@Entity('booking_links')
export class BookingLink {
  @PrimaryColumn({ length: 30 }) code!: string;
  @Column({ length: 500 }) url!: string;
  @UpdateDateColumn() updatedAt!: Date;
}
@Entity('events')
export class TrainingEvent {
  @PrimaryGeneratedColumn() id!: number;
  @Column() title!: string;
  @Column({ type: 'text' }) description!: string;
  @Column() location!: string;
  @Column() city!: string;
  @Column({ type: 'date' }) startDate!: string;
  @Column({ type: 'date' }) endDate!: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) image!: string | null;
  @Column() capacity!: number;
  @Column({ default: false }) published!: boolean;
  @Column({ length: 20, default: 'open' }) status!: 'open' | 'closed' | 'cancelled';
  @UpdateDateColumn() updatedAt!: Date;
}
@Entity('event_registrations')
@Index(['eventId', 'email'], { unique: true })
export class EventRegistration {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() eventId!: number;
  @Column({ length: 64, unique: true, select: false }) submissionHash!: string;
  @Column({ length: 64, select: false }) requestHash!: string;
  @Column({ length: 120 }) name!: string;
  @Column() email!: string;
  @Column({ length: 40 }) phone!: string;
  @Column({ type: 'text', nullable: true }) comment!: string | null;
  @Column({ length: 30 }) privacyVersion!: string;
  @Column({ length: 20, default: 'pending' }) status!: RegistrationStatus;
  @Column({ default: 0 }) revision!: number;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
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
@Entity('program_deliveries')
@Index(['status', 'nextAttemptAt'])
export class Delivery {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ length: 150, unique: true }) dedupeKey!: string;
  @Column({ type: 'varchar', length: 36, nullable: true }) leadId!: string | null;
  @Column({ type: 'varchar', length: 36, nullable: true }) registrationId!: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) recipient!: string | null;
  @Column() subject!: string;
  @Column({ type: 'text' }) text!: string;
  @Column({ type: 'mediumtext', select: false }) html!: string;
  @Column({ length: 20, default: 'pending' }) status!: 'pending' | 'sent' | 'failed';
  @Column({ default: 0 }) attempts!: number;
  @Column({ type: 'datetime' }) nextAttemptAt!: Date;
  @Column({ type: 'text', nullable: true }) lastError!: string | null;
}
export const entities = [
  Lead,
  BookingLink,
  TrainingEvent,
  EventRegistration,
  Administrator,
  Session,
  Media,
  Delivery,
];
