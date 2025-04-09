import {
  BaseEntity,
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("transcriptions")
export class Transcription extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ nullable: true, type: "varchar" })
  language?: string;

  @Column({ name: "target_id", nullable: true, type: "uuid" })
  targetId?: string;

  @Column({ name: "target_type", nullable: true, type: "varchar" })
  targetType?: string;

  @Index({ unique: true })
  @Column({ name: "target_md5", type: "varchar" })
  targetMd5!: string;

  @Column({ type: "varchar", default: "pending" })
  state!: "pending" | "processing" | "finished";

  @Column({ nullable: true, type: "varchar" })
  engine?: string;

  @Column({ nullable: true, type: "varchar" })
  model?: string;

  @Column({ type: "json", default: "{}" })
  result!: Record<string, any>;

  @Column({ name: "synced_at", type: "date", nullable: true })
  syncedAt?: Date;

  @Column({
    name: "created_at",
    type: "date",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @Column({
    name: "updated_at",
    type: "date",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;
}
