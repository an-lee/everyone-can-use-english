import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("videos")
export class Video extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "language", type: "varchar" })
  language!: string;

  @Column({ name: "source", type: "varchar" })
  source!: string;

  @Column({ name: "md5", type: "varchar" })
  md5!: string;

  @Column({ name: "name", type: "varchar" })
  name!: string;

  @Column({ name: "description", type: "varchar" })
  description!: string;

  @Column({ name: "metadata", type: "json" })
  metadata!: any;

  @Column({ name: "cover_url", type: "varchar" })
  coverUrl!: string;

  @Column({ name: "recordings_count", type: "integer" })
  recordingsCount!: number;

  @Column({ name: "recordings_duration", type: "integer" })
  recordingsDuration!: number;

  @Column({ name: "synced_at", type: "date" })
  syncedAt!: Date;

  @Column({ name: "uploaded_at", type: "date" })
  uploadedAt!: Date;

  @Column({ name: "deleted_at", type: "date", nullable: true })
  deletedAt?: Date;

  @CreateDateColumn({ name: "created_at", type: "date" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "date" })
  updatedAt!: Date;
}
