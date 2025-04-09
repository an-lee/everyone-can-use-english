import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";

@Entity("pronunciation_assessments")
export class PronunciationAssessment extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  language!: string;

  @Column({ name: "target_id", type: "uuid" })
  targetId!: string;

  @Column({ name: "target_type", type: "varchar" })
  targetType!: string;

  @Column({ name: "reference_text", type: "text" })
  referenceText!: string;

  @Column({ name: "accuracy_score", type: "float" })
  accuracyScore!: number;

  @Column({ name: "completeness_score", type: "float", nullable: true })
  completenessScore?: number;

  @Column({ name: "fluency_score", type: "float", nullable: true })
  fluencyScore?: number;

  @Column({ name: "prosody_score", type: "float", nullable: true })
  prosodyScore?: number;

  @Column({ name: "pronunciation_score", type: "float", nullable: true })
  pronunciationScore?: number;

  @Column({ name: "grammar_score", type: "float", nullable: true })
  grammarScore?: number;

  @Column({ name: "vocabulary_score", type: "float", nullable: true })
  vocabularyScore?: number;

  @Column({ name: "topic_score", type: "float", nullable: true })
  topicScore?: number;

  @Column({ name: "result", type: "json" })
  result!: Record<string, any>;

  @Column({ name: "synced_at", type: "date" })
  syncedAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "date" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "date" })
  updatedAt!: Date;
}
