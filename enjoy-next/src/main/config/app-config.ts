import Store from "electron-store";
import {
  WS_URL,
  WEB_API_URL,
  LIBRARY_PATH_SUFFIX,
  DATABASE_NAME,
  USER_DATA_SUB_PATH,
} from "@shared/constants";
import path from "path";
import { app, ipcMain } from "electron";
import fs from "fs-extra";
import { UserType } from "@renderer/api";
import { EventEmitter } from "events";
import log from "@main/services/logger";

const logger = log.scope("AppConfig");

const APP_CONFIG_SCHEMA = {
  libraryPath: {
    type: "string",
    default:
      process.env.LIBRARY_PATH ||
      path.join(app.getPath("documents"), LIBRARY_PATH_SUFFIX),
  },
  webApiUrl: { type: "string", default: WEB_API_URL },
  wsUrl: { type: "string", default: WS_URL },
  proxy: {
    type: "object",
    properties: {
      enabled: { type: "boolean", default: false },
      url: { type: "string" },
    },
  },
  user: {
    type: "object",
    properties: {
      id: { type: "number" },
      name: { type: "string" },
      avatarUrl: { type: "string" },
      accessToken: { type: "string" },
    },
  },
  sessions: {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "number" },
        name: { type: "string" },
        avatarUrl: { type: "string" },
        accessToken: { type: "string" },
      },
    },
  },
};

class AppConfig extends EventEmitter {
  private store: any;
  private isInitialized: boolean = false;
  private ipcHandlersRegistered: boolean = false;

  constructor() {
    super();
    this.store = new Store({
      schema: APP_CONFIG_SCHEMA,
    });
  }

  // Initialize app configuration
  async initialize() {
    try {
      if (this.isInitialized) {
        logger.info("AppConfig already initialized");
        return true;
      }

      logger.info("Initializing AppConfig");
      logger.info(`Configuration loaded from: ${this.store.path}`);

      // Verify paths
      await this.ensureLibraryPath();
      logger.info(`Library path verified: ${this.get("libraryPath")}`);

      // Setup IPC handlers only once
      this.setupIpcHandlers();

      // Check if user is already logged in
      const user = this.currentUser();
      if (user) {
        logger.info(`User found: ${user.name || user.id}`);

        // Emit user login event after initialization is complete
        this.emit("user:login", user.id);
      } else {
        logger.info("No authenticated user found");
      }

      this.isInitialized = true;
      logger.info("AppConfig initialized successfully");
      return true;
    } catch (error) {
      logger.error("Failed to initialize AppConfig", error);
      return false;
    }
  }

  get(key: keyof typeof APP_CONFIG_SCHEMA | string) {
    return this.store.get(key);
  }

  set(key: keyof typeof APP_CONFIG_SCHEMA | string, value: any) {
    this.store.set(key, value);

    // Emit events for user login/logout
    if (key === "user.id" && value) {
      this.emit("user:login", value);
    }
  }

  file() {
    return this.store.path;
  }

  currentUser() {
    return this.get("user");
  }

  logout() {
    const currentUser = this.currentUser();
    if (!currentUser) return;

    let sessions = this.get("sessions") || [];
    sessions = sessions.filter((s: UserType) => typeof s.id === "number");

    // Check if user already exists in sessions
    const existingSessionIndex = sessions.findIndex(
      (s: UserType) => s.id === currentUser.id
    );

    // Only add to sessions if not already there
    if (existingSessionIndex === -1) {
      this.set("sessions", [...sessions, currentUser]);
    }

    // Always emit logout event and delete user
    logger.info(`Logging out user: ${currentUser.id}`);
    this.emit("user:logout", currentUser);
    this.store.delete("user");
  }

  async ensureLibraryPath() {
    const libraryPath = this.get("libraryPath");
    if (path.parse(libraryPath).base !== LIBRARY_PATH_SUFFIX) {
      return path.join(libraryPath, LIBRARY_PATH_SUFFIX);
    }

    try {
      await fs.ensureDir(libraryPath);
      this.set("libraryPath", libraryPath);
      return libraryPath;
    } catch (error) {
      logger.error("Failed to ensure library path", error);
      throw error;
    }
  }

  libraryPath() {
    return this.get("libraryPath");
  }

  userDataPath(subPath: string = "") {
    if (!this.currentUser()) return null;

    if (subPath && !USER_DATA_SUB_PATH.includes(subPath)) {
      throw new Error(`Invalid subPath: ${subPath}`);
    }

    const tmpPath = path.join(
      this.libraryPath(),
      this.currentUser()!.id.toString(),
      subPath
    );
    fs.ensureDirSync(tmpPath);
    return tmpPath;
  }

  dbPath() {
    if (!this.userDataPath()) return null;

    const dbName = app.isPackaged
      ? `${DATABASE_NAME}.sqlite`
      : `${DATABASE_NAME}_dev.sqlite`;
    return path.join(this.userDataPath()!, dbName);
  }

  cachePath() {
    const tmpDir = path.join(this.get("libraryPath"), "cache");
    fs.ensureDirSync(tmpDir);
    return tmpDir;
  }

  setupIpcHandlers() {
    // Only register handlers once
    if (this.ipcHandlersRegistered) {
      logger.debug("AppConfig IPC handlers already registered, skipping");
      return;
    }

    try {
      ipcMain.handle("appConfig:get", (_event, key) => this.get(key));
      ipcMain.handle("appConfig:set", (_event, key, value) =>
        this.set(key, value)
      );
      ipcMain.handle("appConfig:file", () => this.file());
      ipcMain.handle("appConfig:libraryPath", () => this.libraryPath());
      ipcMain.handle("appConfig:currentUser", () => this.currentUser());
      ipcMain.handle("appConfig:logout", () => this.logout());
      ipcMain.handle("appConfig:userDataPath", (_event, subPath) =>
        this.userDataPath(subPath)
      );
      ipcMain.handle("appConfig:dbPath", () => this.dbPath());
      ipcMain.handle("appConfig:cachePath", () => this.cachePath());

      this.ipcHandlersRegistered = true;
      logger.info("AppConfig IPC handlers set up");
    } catch (error) {
      logger.error("Failed to register AppConfig IPC handlers", error);
      // Don't set ipcHandlersRegistered to true if there was an error
    }
  }
}

const appConfig = new AppConfig();

export default appConfig;
