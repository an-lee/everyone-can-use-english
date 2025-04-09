import { MIME_TYPES } from "@/shared/constants";
import { appConfig } from "@main/core";
import fs from "fs-extra";
import path from "path";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("recordings")
export class Recording extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "language", type: "varchar" })
  language!: string;

  @Column({
    name: "target_id",
    type: "uuid",
    default: "00000000-0000-0000-0000-000000000000",
  })
  targetId!: string;

  @Column({ name: "target_type", type: "varchar" })
  targetType!: "Audio" | "Video" | "ChatMessage" | "None";

  @Index({ unique: true })
  @Column({ name: "md5", type: "varchar" })
  md5!: string;

  @Column({ name: "filename", type: "varchar" })
  filename!: string;

  @Column({ name: "reference_id", type: "integer" })
  referenceId!: number;

  @Column({ name: "reference_text", type: "text" })
  referenceText!: string;

  @Column({ name: "duration", type: "integer" })
  duration!: number;

  @Column({ name: "synced_at", type: "date", nullable: true })
  syncedAt?: Date;

  @Column({ name: "uploaded_at", type: "date", nullable: true })
  uploadedAt?: Date;

  @Column({ name: "deleted_at", type: "date", nullable: true })
  deletedAt?: Date;

  @CreateDateColumn({ name: "created_at", type: "date" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "date" })
  updatedAt!: Date;

  get filePath(): string | null {
    const file = appConfig.userDataPath("recordings", `${this.filename}`);
    if (file && fs.existsSync(file)) {
      return file;
    }

    return null;
  }

  get src(): string | null {
    if (!this.filePath) return null;

    return `enjoy://${path.posix.join("library", "recordings", this.filename)}`;
  }

  get extname(): string {
    if (!this.filePath) return "";
    return path.extname(this.filePath);
  }

  get mimeType(): string {
    return MIME_TYPES[this.extname.toLowerCase()] || "audio/mpeg";
  }

  get isSynced(): boolean {
    return Boolean(this.syncedAt) && this.syncedAt! >= this.updatedAt;
  }

  get isUploaded(): boolean {
    return Boolean(this.uploadedAt) && this.uploadedAt! >= this.updatedAt;
  }

  get isDeleted(): boolean {
    return Boolean(this.deletedAt) && this.deletedAt! >= this.updatedAt;
  }
}
