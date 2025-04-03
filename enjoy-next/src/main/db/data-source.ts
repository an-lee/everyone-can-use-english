import { DataSource } from "typeorm";
import { Audio } from "./entities/audio";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "enjoy.db",
  entities: [Audio],
  synchronize: true,
});
