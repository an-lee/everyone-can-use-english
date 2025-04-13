import {
  BaseEntity,
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Min } from "class-validator";
import path from "path";
import { appConfig } from "@/main/core/app/config";
import fs from "fs-extra";

@Entity("audios")
export class Audio extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
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

  @Column({ type: "json", default: "{}" })
  metadata!: Record<string, any>;

  @Column({ name: "cover_url", nullable: true, type: "varchar" })
  coverUrl?: string;

  @Min(0)
  @Column({ name: "recordings_count", default: 0, type: "integer" })
  recordingsCount!: number;

  @Min(0)
  @Column({ name: "recordings_duration", default: 0, type: "integer" })
  recordingsDuration!: number;

  @Column({ name: "synced_at", type: "date", nullable: true })
  syncedAt?: Date;

  @Column({ name: "uploaded_at", type: "date", nullable: true })
  uploadedAt?: Date;

  @CreateDateColumn({
    name: "created_at",
    type: "date",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "date",
  })
  updatedAt!: Date;

  get extname(): string {
    return (
      this.metadata?.extname || (this.source && path.extname(this.source)) || ""
    );
  }

  get filename(): string {
    return this.md5 + this.extname;
  }

  get filePath(): string | null {
    return this.compressedFilePath || this.originalFilePath;
  }

  get compressedFilePath(): string | null {
    const file = path.join(
      appConfig.userDataPath("audios")!,
      this.md5 + ".compressed.mp3"
    );

    if (fs.existsSync(file)) {
      return file;
    } else {
      return null;
    }
  }

  get originalFilePath(): string | null {
    const file = path.join(
      appConfig.userDataPath("audios")!,
      this.md5 + this.extname
    );

    if (fs.existsSync(file)) {
      return file;
    } else {
      return null;
    }
  }

  get src(): string | null {
    if (this.compressedFilePath) {
      return `enjoy://${path.posix.join(
        "library",
        "audios",
        this.md5 + ".compressed.mp3"
      )}`;
    } else if (this.originalFilePath) {
      return `enjoy://${path.posix.join(
        "library",
        "audios",
        this.md5 + this.extname
      )}`;
    } else {
      return null;
    }
  }
}
