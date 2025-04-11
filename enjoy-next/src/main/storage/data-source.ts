import "reflect-metadata";
import { DataSource } from "typeorm";
import {
  Audio,
  CacheObject,
  Chat,
  ChatAgent,
  ChatMember,
  ChatMessage,
  Conversation,
  Document,
  Message,
  Note,
  PronunciationAssessment,
  Recording,
  Segment,
  Speech,
  Transcription,
  UserSetting,
  Video,
} from "./entities";

// Explicitly import migration classes
import { InitSchema1744290634346 } from "./migrations/1744290634346-InitSchema";

const AppDataSource = new DataSource({
  type: "sqlite",
  database: "", // This will be set at runtime in database-manager.ts
  entities: [
    Audio,
    CacheObject,
    Chat,
    ChatAgent,
    ChatMember,
    ChatMessage,
    Conversation,
    Document,
    Message,
    Note,
    PronunciationAssessment,
    Recording,
    Segment,
    Speech,
    Transcription,
    UserSetting,
    Video,
  ],
  synchronize: false,
  migrations: [InitSchema1744290634346],
  migrationsTableName: "migrations",
});

export { AppDataSource };
export default AppDataSource;
