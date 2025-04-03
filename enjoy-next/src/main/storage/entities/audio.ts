import { BaseEntity, Entity, Column, Index } from "typeorm";

@Entity("audios")
export class Audio extends BaseEntity {
  @Column({ primary: true, type: "uuid", generated: true })
  id!: string;

  @Column({ nullable: true })
  language?: string;

  @Column({ nullable: true })
  source?: string;

  @Index({ unique: true })
  @Column()
  md5!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ type: "jsonb", default: {} })
  metadata!: Record<string, any>;

  @Column({ nullable: true })
  coverUrl?: string;

  @Column({ name: "recordings_count", default: 0 })
  recordingsCount!: number;

  @Column({ name: "recordings_duration", default: 0 })
  recordingsDuration!: number;

  @Column({ name: "synced_at" })
  syncedAt?: Date;

  @Column({ name: "uploaded_at" })
  uploadedAt?: Date;

  @Column({ name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column({ name: "updated_at", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
