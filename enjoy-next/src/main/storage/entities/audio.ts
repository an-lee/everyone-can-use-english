import { BaseEntity, Entity, Column, Index } from "typeorm";

@Entity("audios")
export class Audio extends BaseEntity {
  @Column({ primary: true, type: "uuid", generated: true })
  id!: string;

  @Column({ nullable: true, type: "varchar" })
  language?: string;

  @Column({ nullable: true, type: "varchar" })
  source?: string;

  @Index({ unique: true })
  @Column({ type: "varchar" })
  md5!: string;

  @Column({ nullable: true, type: "varchar" })
  description?: string;

  @Column({ nullable: true, type: "varchar" })
  name?: string;

  @Column({ type: "text", default: "{}" })
  metadata!: Record<string, any>;

  @Column({ nullable: true, type: "varchar" })
  coverUrl?: string;

  @Column({ name: "recordings_count", default: 0, type: "integer" })
  recordingsCount!: number;

  @Column({ name: "recordings_duration", default: 0, type: "integer" })
  recordingsDuration!: number;

  @Column({ name: "synced_at", type: "datetime", nullable: true })
  syncedAt?: Date;

  @Column({ name: "uploaded_at", type: "datetime", nullable: true })
  uploadedAt?: Date;

  @Column({
    name: "created_at",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @Column({
    name: "updated_at",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;
}
