import Store from "electron-store";
import path from "path";
import { app } from "electron";
import fs from "fs-extra";
import {
  WS_URL,
  WEB_API_URL,
  LIBRARY_PATH_SUFFIX,
  DATABASE_NAME,
  USER_DATA_SUB_PATH,
} from "@shared/constants";
import { APP_CONFIG_SCHEMA, AppConfigState } from "./types";
import log from "@/main/core/utils/logger";

const logger = log.scope("AppConfig");

// Create a schema with proper defaults
const schemaWithDefaults = {
  ...APP_CONFIG_SCHEMA,
  libraryPath: {
    ...APP_CONFIG_SCHEMA.libraryPath,
    default:
      process.env.LIBRARY_PATH ||
      path.join(app.getPath("documents"), LIBRARY_PATH_SUFFIX),
  },
  webApiUrl: { ...APP_CONFIG_SCHEMA.webApiUrl, default: WEB_API_URL },
  wsUrl: { ...APP_CONFIG_SCHEMA.wsUrl, default: WS_URL },
};

// Create electron store with schema
export const configStore = new Store({
  schema: schemaWithDefaults,
}) as any;

// Path helper functions
export const getLibraryPath = (): string => {
  return configStore.get("libraryPath");
};

export const ensureLibraryPath = async (): Promise<string> => {
  const libraryPath = getLibraryPath();
  if (path.parse(libraryPath).base !== LIBRARY_PATH_SUFFIX) {
    return path.join(libraryPath, LIBRARY_PATH_SUFFIX);
  }

  try {
    await fs.ensureDir(libraryPath);
    configStore.set("libraryPath", libraryPath);
    return libraryPath;
  } catch (error) {
    logger.error("Failed to ensure library path", error);
    throw error;
  }
};

export const getUserDataPath = (
  userId: number | null,
  subPath: string = ""
): string | null => {
  if (!userId) return null;

  if (subPath && !USER_DATA_SUB_PATH.includes(subPath)) {
    throw new Error(`Invalid subPath: ${subPath}`);
  }

  const tmpPath = path.join(getLibraryPath(), userId.toString(), subPath);
  fs.ensureDirSync(tmpPath);
  return tmpPath;
};

export const getDbPath = (userId: number | null): string | null => {
  if (!userId) return null;

  const userDataPath = getUserDataPath(userId);
  if (!userDataPath) return null;

  const dbName = app.isPackaged
    ? `${DATABASE_NAME}.sqlite`
    : `${DATABASE_NAME}_dev.sqlite`;
  return path.join(userDataPath, dbName);
};

export const getCachePath = (): string => {
  const tmpDir = path.join(getLibraryPath(), "cache");
  fs.ensureDirSync(tmpDir);
  return tmpDir;
};

export const getConfigFilePath = (): string => {
  return configStore.path;
};
