import "reflect-metadata";
import { DataSource } from "typeorm";
import { Audio } from "./entities/audio";
import appConfig from "@main/config/app-config";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: appConfig.dbPath()!,
  entities: [Audio],
  synchronize: true,
});
