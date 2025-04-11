import { MigrationInterface, QueryRunner, Table, TableColumn } from "typeorm";

/**
 * Migration to create the initial database schema
 * Migrates from the old Sequelize-based database structure to TypeORM
 */
export class InitSchema1744290634346 implements MigrationInterface {
  name = "InitSchema1744290634346";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create audio table
    if (!(await queryRunner.hasTable("audios"))) {
      await this.createAudioTable(queryRunner);
    }

    // Create cache_objects table
    if (!(await queryRunner.hasTable("cache_objects"))) {
      await this.createCacheObjectTable(queryRunner);
    }

    // Create conversations table
    if (!(await queryRunner.hasTable("conversations"))) {
      await this.createConversationTable(queryRunner);
    }

    // Create chat_agents table
    if (!(await queryRunner.hasTable("chat_agents"))) {
      await this.createChatAgentTable(queryRunner);
    }

    // Create chat_members table
    if (!(await queryRunner.hasTable("chat_members"))) {
      await this.createChatMemberTable(queryRunner);
    }

    // Create chat_messages table
    if (!(await queryRunner.hasTable("chat_messages"))) {
      await this.createChatMessageTable(queryRunner);
    }

    // Create chats table
    if (!(await queryRunner.hasTable("chats"))) {
      await this.createChatTable(queryRunner);
    }

    // Create conversations table
    if (!(await queryRunner.hasTable("conversations"))) {
      await this.createConversationTable(queryRunner);
    }

    // Create documents table
    if (!(await queryRunner.hasTable("documents"))) {
      await this.createDocumentTable(queryRunner);
    }

    // Create messages table
    if (!(await queryRunner.hasTable("messages"))) {
      await this.createMessageTable(queryRunner);
    }

    // Create notes table
    if (!(await queryRunner.hasTable("notes"))) {
      await this.createNoteTable(queryRunner);
    }

    // Create pronunciation_assessments table
    if (!(await queryRunner.hasTable("pronunciation_assessments"))) {
      await this.createPronunciationAssessmentTable(queryRunner);
    }

    // Create recordings table
    if (!(await queryRunner.hasTable("recordings"))) {
      await this.createRecordingTable(queryRunner);
    }

    // Create segments table
    if (!(await queryRunner.hasTable("segments"))) {
      await this.createSegmentTable(queryRunner);
    }

    // Create speeches table
    if (!(await queryRunner.hasTable("speeches"))) {
      await this.createSpeechTable(queryRunner);
    }

    // Create transcriptions table
    if (!(await queryRunner.hasTable("transcriptions"))) {
      await this.createTranscriptionTable(queryRunner);
    }

    // Create user_settings table
    if (!(await queryRunner.hasTable("user_settings"))) {
      await this.createUserSettingTable(queryRunner);
    }

    // Create videos table
    if (!(await queryRunner.hasTable("videos"))) {
      await this.createVideoTable(queryRunner);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("audios");
    await queryRunner.dropTable("cache_objects");
    await queryRunner.dropTable("conversations");
    await queryRunner.dropTable("chat_agents");
    await queryRunner.dropTable("chat_members");
    await queryRunner.dropTable("chat_messages");
    await queryRunner.dropTable("chats");
    await queryRunner.dropTable("conversations");
    await queryRunner.dropTable("documents");
    await queryRunner.dropTable("messages");
    await queryRunner.dropTable("notes");
    await queryRunner.dropTable("pronunciation_assessments");
    await queryRunner.dropTable("recordings");
    await queryRunner.dropTable("segments");
    await queryRunner.dropTable("speeches");
    await queryRunner.dropTable("transcriptions");
    await queryRunner.dropTable("user_settings");
    await queryRunner.dropTable("videos");
  }

  private async createAudioTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "audios",
        columns: [
          new TableColumn({
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
          }),
          new TableColumn({
            name: "language",
            type: "varchar",
          }),
          new TableColumn({
            name: "source",
            type: "varchar",
          }),
          new TableColumn({
            name: "md5",
            type: "varchar",
          }),
          new TableColumn({
            name: "description",
            type: "varchar",
          }),
          new TableColumn({
            name: "name",
            type: "varchar",
          }),
          new TableColumn({
            name: "metadata",
            type: "json",
          }),
          new TableColumn({
            name: "cover_url",
            type: "varchar",
          }),
          new TableColumn({
            name: "recordings_count",
            type: "integer",
            default: 0,
          }),
          new TableColumn({
            name: "recordings_duration",
            type: "integer",
            default: 0,
          }),
          new TableColumn({
            name: "synced_at",
            type: "date",
          }),
          new TableColumn({
            name: "uploaded_at",
            type: "date",
          }),
          new TableColumn({
            name: "created_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
          new TableColumn({
            name: "updated_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
        ],
      })
    );
  }

  private async createCacheObjectTable(
    queryRunner: QueryRunner
  ): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "cache_objects",
        columns: [
          new TableColumn({
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
          }),
          new TableColumn({
            name: "key",
            type: "varchar",
          }),
          new TableColumn({
            name: "value",
            type: "text",
          }),
          new TableColumn({
            name: "ttl",
            type: "integer",
            default: 0,
          }),
          new TableColumn({
            name: "created_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
          new TableColumn({
            name: "updated_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
        ],
      })
    );
  }

  private async createChatAgentTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "chat_agents",
        columns: [
          new TableColumn({
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
          }),
          new TableColumn({
            name: "name",
            type: "varchar",
          }),
          new TableColumn({
            name: "type",
            type: "varchar",
          }),
          new TableColumn({
            name: "description",
            type: "text",
          }),
          new TableColumn({
            name: "avatar_url",
            type: "varchar",
          }),
          new TableColumn({
            name: "source",
            type: "varchar",
          }),
          new TableColumn({
            name: "config",
            type: "json",
          }),
          new TableColumn({
            name: "created_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
          new TableColumn({
            name: "updated_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
        ],
      })
    );
  }

  private async createChatMemberTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "chat_members",
        columns: [
          new TableColumn({
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
          }),
          new TableColumn({
            name: "chat_id",
            type: "uuid",
          }),
          new TableColumn({
            name: "user_id",
            type: "uuid",
          }),
          new TableColumn({
            name: "user_type",
            type: "varchar",
          }),
          new TableColumn({
            name: "config",
            type: "json",
          }),
          new TableColumn({
            name: "created_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
          new TableColumn({
            name: "updated_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
        ],
      })
    );
  }

  private async createChatMessageTable(
    queryRunner: QueryRunner
  ): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "chat_messages",
        columns: [
          new TableColumn({
            name: "id",
            type: "uuid",
          }),
          new TableColumn({
            name: "chat_id",
            type: "uuid",
          }),
          new TableColumn({
            name: "role",
            type: "varchar",
          }),
          new TableColumn({
            name: "category",
            type: "varchar",
          }),
          new TableColumn({
            name: "member_id",
            type: "uuid",
          }),
          new TableColumn({
            name: "agent_id",
            type: "uuid",
          }),
          new TableColumn({
            name: "mentions",
            type: "json",
          }),
          new TableColumn({
            name: "content",
            type: "text",
          }),
          new TableColumn({
            name: "state",
            type: "varchar",
          }),
          new TableColumn({
            name: "created_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
          new TableColumn({
            name: "updated_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
        ],
      })
    );
  }

  private async createChatTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "chats",
        columns: [
          new TableColumn({
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
          }),
          new TableColumn({
            name: "name",
            type: "varchar",
          }),
          new TableColumn({
            name: "type",
            type: "varchar",
          }),
          new TableColumn({
            name: "digest",
            type: "varchar",
          }),
          new TableColumn({
            name: "config",
            type: "json",
          }),
          new TableColumn({
            name: "created_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
          new TableColumn({
            name: "updated_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
        ],
      })
    );
  }

  private async createConversationTable(
    queryRunner: QueryRunner
  ): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "conversations",
        columns: [
          new TableColumn({
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
          }),
          new TableColumn({
            name: "name",
            type: "varchar",
          }),
          new TableColumn({
            name: "engine",
            type: "varchar",
          }),
          new TableColumn({
            name: "configuration",
            type: "json",
          }),
          new TableColumn({
            name: "created_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
          new TableColumn({
            name: "updated_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
        ],
      })
    );
  }

  private async createDocumentTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "documents",
        columns: [
          new TableColumn({
            name: "id",
            type: "uuid",
          }),
          new TableColumn({
            name: "language",
            type: "varchar",
          }),
          new TableColumn({
            name: "md5",
            type: "varchar",
          }),
          new TableColumn({
            name: "source",
            type: "varchar",
          }),
          new TableColumn({
            name: "title",
            type: "varchar",
          }),
          new TableColumn({
            name: "cover_url",
            type: "varchar",
          }),
          new TableColumn({
            name: "metadata",
            type: "json",
          }),
          new TableColumn({
            name: "config",
            type: "json",
          }),
          new TableColumn({
            name: "last_read_position",
            type: "json",
          }),
          new TableColumn({
            name: "last_read_at",
            type: "date",
          }),
          new TableColumn({
            name: "synced_at",
            type: "date",
          }),
          new TableColumn({
            name: "uploaded_at",
            type: "date",
          }),
          new TableColumn({
            name: "created_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
          new TableColumn({
            name: "updated_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
        ],
      })
    );
  }

  private async createMessageTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "messages",
        columns: [
          new TableColumn({
            name: "id",
            type: "uuid",
          }),
          new TableColumn({
            name: "conversation_id",
            type: "uuid",
          }),
          new TableColumn({
            name: "content",
            type: "text",
          }),
          new TableColumn({
            name: "role",
            type: "varchar",
          }),
          new TableColumn({
            name: "created_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
          new TableColumn({
            name: "updated_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
        ],
      })
    );
  }

  private async createNoteTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "notes",
        columns: [
          new TableColumn({
            name: "id",
            type: "uuid",
          }),
          new TableColumn({
            name: "target_id",
            type: "uuid",
          }),
          new TableColumn({
            name: "target_type",
            type: "varchar",
          }),
          new TableColumn({
            name: "content",
            type: "text",
          }),
          new TableColumn({
            name: "parameters",
            type: "json",
          }),
          new TableColumn({
            name: "synced_at",
            type: "date",
          }),
          new TableColumn({
            name: "created_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
          new TableColumn({
            name: "updated_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
        ],
      })
    );
  }

  private async createPronunciationAssessmentTable(
    queryRunner: QueryRunner
  ): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "pronunciation_assessments",
        columns: [
          new TableColumn({
            name: "id",
            type: "uuid",
          }),
          new TableColumn({
            name: "language",
            type: "varchar",
          }),
          new TableColumn({
            name: "target_id",
            type: "uuid",
          }),
          new TableColumn({
            name: "target_type",
            type: "varchar",
          }),
          new TableColumn({
            name: "reference_text",
            type: "text",
          }),
          new TableColumn({
            name: "accuracy_score",
            type: "float",
          }),
          new TableColumn({
            name: "completeness_score",
            type: "float",
          }),
          new TableColumn({
            name: "fluency_score",
            type: "float",
          }),
          new TableColumn({
            name: "prosody_score",
            type: "float",
          }),
          new TableColumn({
            name: "pronunciation_score",
            type: "float",
          }),
          new TableColumn({
            name: "grammar_score",
            type: "float",
          }),
          new TableColumn({
            name: "vocabulary_score",
            type: "float",
          }),
          new TableColumn({
            name: "topic_score",
            type: "float",
          }),
          new TableColumn({
            name: "result",
            type: "json",
          }),
          new TableColumn({
            name: "synced_at",
            type: "date",
          }),
          new TableColumn({
            name: "created_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
          new TableColumn({
            name: "updated_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
        ],
      })
    );
  }

  private async createRecordingTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "recordings",
        columns: [
          new TableColumn({
            name: "id",
            type: "uuid",
          }),
          new TableColumn({
            name: "language",
            type: "varchar",
          }),
          new TableColumn({
            name: "target_id",
            type: "uuid",
          }),
          new TableColumn({
            name: "target_type",
            type: "varchar",
          }),
          new TableColumn({
            name: "md5",
            type: "varchar",
          }),
          new TableColumn({
            name: "filename",
            type: "varchar",
          }),
          new TableColumn({
            name: "reference_id",
            type: "integer",
          }),
          new TableColumn({
            name: "reference_text",
            type: "text",
          }),
          new TableColumn({
            name: "duration",
            type: "integer",
            default: 0,
          }),
          new TableColumn({
            name: "synced_at",
            type: "date",
          }),
          new TableColumn({
            name: "uploaded_at",
            type: "date",
          }),
          new TableColumn({
            name: "deleted_at",
            type: "date",
          }),
          new TableColumn({
            name: "created_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
          new TableColumn({
            name: "updated_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
        ],
      })
    );
  }

  private async createSegmentTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "segments",
        columns: [
          new TableColumn({
            name: "id",
            type: "uuid",
          }),
          new TableColumn({
            name: "target_id",
            type: "uuid",
          }),
          new TableColumn({
            name: "target_type",
            type: "varchar",
          }),
          new TableColumn({
            name: "segment_index",
            type: "integer",
          }),
          new TableColumn({
            name: "md5",
            type: "varchar",
          }),
          new TableColumn({
            name: "caption",
            type: "json",
          }),
          new TableColumn({
            name: "start_time",
            type: "integer",
          }),
          new TableColumn({
            name: "end_time",
            type: "integer",
          }),
          new TableColumn({
            name: "synced_at",
            type: "date",
          }),
          new TableColumn({
            name: "uploaded_at",
            type: "date",
          }),
          new TableColumn({
            name: "created_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
          new TableColumn({
            name: "updated_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
        ],
      })
    );
  }

  private async createSpeechTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "speeches",
        columns: [
          new TableColumn({
            name: "id",
            type: "uuid",
          }),
          new TableColumn({
            name: "source_id",
            type: "uuid",
          }),
          new TableColumn({
            name: "source_type",
            type: "varchar",
          }),
          new TableColumn({
            name: "text",
            type: "text",
          }),
          new TableColumn({
            name: "section",
            type: "integer",
          }),
          new TableColumn({
            name: "segment",
            type: "integer",
          }),
          new TableColumn({
            name: "configuration",
            type: "json",
          }),
          new TableColumn({
            name: "md5",
            type: "varchar",
          }),
          new TableColumn({
            name: "extname",
            type: "varchar",
          }),
          new TableColumn({
            name: "created_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
          new TableColumn({
            name: "updated_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
        ],
      })
    );
  }

  private async createTranscriptionTable(
    queryRunner: QueryRunner
  ): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "transcriptions",
        columns: [
          new TableColumn({
            name: "id",
            type: "uuid",
          }),
          new TableColumn({
            name: "language",
            type: "varchar",
          }),
          new TableColumn({
            name: "target_id",
            type: "uuid",
          }),
          new TableColumn({
            name: "target_type",
            type: "varchar",
          }),
          new TableColumn({
            name: "target_md5",
            type: "varchar",
          }),
          new TableColumn({
            name: "state",
            type: "varchar",
          }),
          new TableColumn({
            name: "engine",
            type: "varchar",
          }),
          new TableColumn({
            name: "model",
            type: "varchar",
          }),
          new TableColumn({
            name: "result",
            type: "json",
          }),
          new TableColumn({
            name: "synced_at",
            type: "date",
          }),
          new TableColumn({
            name: "created_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
          new TableColumn({
            name: "updated_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
        ],
      })
    );
  }

  private async createUserSettingTable(
    queryRunner: QueryRunner
  ): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "user_settings",
        columns: [
          new TableColumn({
            name: "id",
            type: "uuid",
          }),
          new TableColumn({
            name: "key",
            type: "varchar",
          }),
          new TableColumn({
            name: "value",
            type: "text",
          }),
          new TableColumn({
            name: "created_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
          new TableColumn({
            name: "updated_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
        ],
      })
    );
  }

  private async createVideoTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "videos",
        columns: [
          new TableColumn({
            name: "id",
            type: "uuid",
          }),
          new TableColumn({
            name: "language",
            type: "varchar",
          }),
          new TableColumn({
            name: "source",
            type: "varchar",
          }),
          new TableColumn({
            name: "md5",
            type: "varchar",
          }),
          new TableColumn({
            name: "name",
            type: "varchar",
          }),
          new TableColumn({
            name: "description",
            type: "varchar",
          }),
          new TableColumn({
            name: "metadata",
            type: "json",
          }),
          new TableColumn({
            name: "cover_url",
            type: "varchar",
          }),
          new TableColumn({
            name: "recordings_count",
            type: "integer",
            default: 0,
          }),
          new TableColumn({
            name: "recordings_duration",
            type: "integer",
            default: 0,
          }),
          new TableColumn({
            name: "synced_at",
            type: "date",
          }),
          new TableColumn({
            name: "uploaded_at",
            type: "date",
          }),
          new TableColumn({
            name: "created_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
          new TableColumn({
            name: "updated_at",
            type: "date",
            default: "CURRENT_TIMESTAMP",
          }),
        ],
      })
    );
  }
}
