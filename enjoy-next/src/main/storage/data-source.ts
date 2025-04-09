import "reflect-metadata";
import { DataSource } from "typeorm";
import { Audio, Transcription } from "@main/storage/entities";
import appConfig from "@main/core/app/config";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: appConfig.dbPath()!,
  entities: [Audio, Transcription],
  synchronize: false,
});
