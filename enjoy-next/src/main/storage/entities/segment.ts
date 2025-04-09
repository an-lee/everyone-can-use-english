import { appConfig } from "@/main/core";
import { MIME_TYPES } from "@/shared/constants";
import fs from "fs-extra";
import path from "path";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

const OUTPUT_FORMAT = "mp3";

@Entity("segments")
export class Segment extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "target_id", type: "uuid" })
  targetId!: string;

  @Column({ name: "target_type", type: "varchar" })
  targetType!: string;

  @Column({ name: "segment_index", type: "integer" })
  segmentIndex!: number;

  @Column({ name: "md5", type: "varchar" })
  md5!: string;

  @Column({ name: "caption", type: "json" })
  caption!: Record<string, any>;

  @Column({ name: "start_time", type: "integer" })
  startTime!: number;

  @Column({ name: "end_time", type: "integer" })
  endTime!: number;

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

  get isSynced(): boolean {
    return Boolean(this.syncedAt) && this.syncedAt >= this.updatedAt;
  }

  get isUploaded(): boolean {
    return Boolean(this.uploadedAt) && this.uploadedAt >= this.updatedAt;
  }

  get src(): string {
    return `enjoy://${path.posix.join(
      "library",
      "segments",
      this.md5 + this.extname
    )}`;
  }

  get filePath(): string | null {
    const file = appConfig.userDataPath(
      "segments",
      `${this.md5}.${OUTPUT_FORMAT}`
    );
    if (file && fs.existsSync(file)) {
      return file;
    }
    return null;
  }

  get extname(): string {
    if (!this.filePath) return "";
    return path.extname(this.filePath);
  }

  get mimeType(): string {
    return MIME_TYPES[this.extname.toLowerCase()] || "audio/mpeg";
  }
}
