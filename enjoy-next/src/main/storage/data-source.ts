import "reflect-metadata";
import { DataSource } from "typeorm";
import {
  Audio,
  CacheObject,
  Conversation,
  Document,
  PronunciationAssessment,
  Recording,
  Segment,
  Speech,
  Transcription,
  UserSetting,
  Video,
} from "@main/storage/entities";
import appConfig from "@main/core/app/config";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: appConfig.dbPath()!,
  entities: [
    Audio,
    CacheObject,
    Conversation,
    Document,
    PronunciationAssessment,
    Recording,
    Segment,
    Speech,
    Transcription,
    UserSetting,
    Video,
  ],
  synchronize: false,
});
