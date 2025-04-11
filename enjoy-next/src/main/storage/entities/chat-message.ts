import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("chat_messages")
export class ChatMessage extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "chat_id", type: "uuid" })
  chatId!: string;

  @Column({ type: "varchar" })
  role!: string;

  @Column({ type: "varchar" })
  category!: string;

  @Column({ name: "member_id", type: "uuid" })
  memberId!: string;

  @Column({ name: "agent_id", type: "uuid" })
  agentId!: string;

  @Column({ type: "json", default: "{}" })
  mentions!: string[];

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "varchar" })
  state!: string;

  @CreateDateColumn({ name: "created_at", type: "date" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "date" })
  updatedAt!: Date;
}
