import { appConfig } from "@/main/core";
import { Client } from "@/renderer/api/client";
import fs from "fs-extra";
import path from "path";
import {
  BaseEntity,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("documents")
export class Document extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  language!: string;

  @Index({ unique: true })
  @Column({ type: "varchar" })
  md5!: string;

  @Column({ name: "source", type: "varchar", nullable: true })
  source?: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ name: "cover_url", type: "varchar", nullable: true })
  coverUrl?: string;

  @Column({ type: "json", default: "{}" })
  metadata!: Record<string, any>;

  @Column({ type: "json", default: "{}" })
  config!: Record<string, any>;

  @Column({ name: "last_read_position", type: "json", default: "{}" })
  lastReadPosition!: Record<string, any>;

  @Column({ name: "last_read_at", type: "date", nullable: true })
  lastReadAt?: Date;

  @Column({ name: "synced_at", type: "date", nullable: true })
  syncedAt?: Date;

  @Column({ name: "uploaded_at", type: "date", nullable: true })
  uploadedAt?: Date;

  @CreateDateColumn({ name: "created_at", type: "date" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "date" })
  updatedAt!: Date;

  get autoTranslate(): boolean {
    return this.config.autoTranslate || false;
  }

  get autoNextSpeech(): boolean {
    return this.config.autoNextSpeech || false;
  }

  get layout(): "horizontal" | "vertical" {
    return this.config.layout || "horizontal";
  }

  get ttsConfig(): Record<string, any> {
    return this.config.tts || {};
  }

  get filePath(): string | null {
    const file = appConfig.userDataPath(
      "documents",
      `${this.md5}.${this.metadata.extension}`
    );

    if (file && fs.existsSync(file)) {
      return file;
    }
    return null;
  }

  get src(): string | null {
    if (!this.filePath) return null;

    return `enjoy://${path.posix.join(
      "library",
      "documents",
      `${this.md5}.${this.metadata.extension}`
    )}`;
  }

  get isSynced(): boolean {
    if (!this.syncedAt) return false;
    return this.syncedAt >= this.updatedAt;
  }

  get isUploaded(): boolean {
    if (!this.uploadedAt) return false;
    return this.uploadedAt >= this.updatedAt;
  }
}
