import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("videos")
export class Video extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "language", type: "varchar", nullable: true })
  language?: string;

  @Column({ name: "source", type: "varchar", nullable: true })
  source?: string;

  @Index({ unique: true })
  @Column({ name: "md5", type: "varchar" })
  md5!: string;

  @Column({ name: "name", type: "varchar" })
  name!: string;

  @Column({ name: "description", type: "varchar", nullable: true })
  description?: string;

  @Column({ name: "metadata", type: "json", default: "{}" })
  metadata!: any;

  @Column({ name: "cover_url", type: "varchar", nullable: true })
  coverUrl?: string;

  @Column({ name: "recordings_count", type: "integer", default: 0 })
  recordingsCount!: number;

  @Column({ name: "recordings_duration", type: "integer", default: 0 })
  recordingsDuration!: number;

  @Column({ name: "synced_at", type: "date", nullable: true })
  syncedAt?: Date;

  @Column({ name: "uploaded_at", type: "date", nullable: true })
  uploadedAt?: Date;

  @CreateDateColumn({ name: "created_at", type: "date" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "date" })
  updatedAt!: Date;
}
