import { sendToMainWindow } from "@main/ipc/helpers";
import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  AfterRemove,
} from "typeorm";

@Entity("conversations")
export class Conversation extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar" })
  engine!: string;

  @Column({ type: "json", default: "{}" })
  configuration!: Record<string, any>;

  @CreateDateColumn({ name: "created_at", type: "date" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "date" })
  updatedAt!: Date;

  get model(): string {
    return this.configuration.model;
  }

  get roleDefinition(): string {
    return this.configuration.roleDefinition;
  }

  @AfterRemove()
  static notifyForDestroy(conversation: Conversation) {
    sendToMainWindow("db:onTransaction", {
      model: "Conversation",
      id: conversation.id,
      action: "destroy",
    });
  }
}
