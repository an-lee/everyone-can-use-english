import { appConfig } from "@/main/core";
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

@Entity("speeches")
export class Speech extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "source_id", type: "uuid" })
  sourceId!: string;

  @Column({ name: "source_type", type: "varchar" })
  sourceType!: string;

  @Column({ name: "text", type: "text" })
  text!: string;

  @Column({ name: "section", type: "integer", nullable: true })
  section?: number;

  @Column({ name: "segment", type: "integer", nullable: true })
  segment?: number;

  @Column({ name: "configuration", type: "json", default: "{}" })
  configuration!: Record<string, any>;

  @Index({ unique: true })
  @Column({ name: "md5", type: "varchar" })
  md5!: string;

  @Column({ name: "extname", type: "varchar" })
  extname!: string;

  @CreateDateColumn({ name: "created_at", type: "date" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "date" })
  updatedAt!: Date;

  get engine(): string {
    return this.configuration.engine;
  }

  get model(): string {
    return this.configuration.model;
  }

  get voice(): string {
    return this.configuration.voice;
  }

  get src(): string {
    return `enjoy://${path.posix.join(
      "library",
      "speeches",
      this.md5 + this.extname
    )}`;
  }

  get filename(): string {
    return this.md5 + this.extname;
  }

  get filePath(): string | null {
    const file = appConfig.userDataPath("speeches", this.filename);
    if (file && fs.existsSync(file)) {
      return file;
    }
    return null;
  }
}
