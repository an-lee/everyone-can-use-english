import "reflect-metadata";
import { DataSource } from "typeorm";
import { Audio } from "@main/storage/entities/audio";
import appConfig from "@/main/core/app/config/app-config";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: appConfig.dbPath()!,
  entities: [Audio],
  synchronize: true,
});
