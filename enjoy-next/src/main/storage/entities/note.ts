import {
  BaseEntity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Entity } from "typeorm";

@Entity("notes")
export class Note extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "target_id", type: "uuid" })
  targetId!: string;

  @Column({ name: "target_type", type: "varchar" })
  targetType!: string;

  @Column({ name: "content", type: "text" })
  content!: string;

  @Column({ name: "parameters", type: "json", default: "{}" })
  parameters!: Record<string, any>;

  @Column({ name: "synced_at", type: "date", nullable: true })
  syncedAt?: Date;

  @CreateDateColumn({ name: "created_at", type: "date" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "date" })
  updatedAt!: Date;
}
