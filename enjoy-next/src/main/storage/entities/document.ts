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

  @Column({ type: "varchar" })
  source!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "varchar" })
  coverUrl!: string;

  @Column({ type: "json" })
  metadata!: Record<string, any>;

  @Column({ type: "json" })
  config!: Record<string, any>;

  @Column({ type: "json" })
  lastReadPosition!: Record<string, any>;

  @Column({ type: "date" })
  lastReadAt!: Date;

  @Column({ type: "date" })
  syncedAt!: Date;

  @Column({ type: "date" })
  uploadedAt!: Date;

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
    return Boolean(this.syncedAt) && this.syncedAt >= this.updatedAt;
  }

  get isUploaded(): boolean {
    return Boolean(this.uploadedAt) && this.uploadedAt >= this.updatedAt;
  }
}
