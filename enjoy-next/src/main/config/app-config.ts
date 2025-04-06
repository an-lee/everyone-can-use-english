import Store from "electron-store";
import {
  WS_URL,
  WEB_API_URL,
  LIBRARY_PATH_SUFFIX,
  DATABASE_NAME,
  USER_DATA_SUB_PATH,
} from "@shared/constants";
import path from "path";
import { app, ipcMain, IpcMainInvokeEvent, BrowserWindow } from "electron";
import fs from "fs-extra";
import { UserType } from "@renderer/api";
import { EventEmitter } from "events";
import log from "@main/services/logger";

const logger = log.scope("AppConfig");

// Application initialization steps
export type InitStep =
  | "starting"
  | "config_loaded"
  | "paths_verified"
  | "user_loaded"
  | "ready";

// Initialization status
export type InitStatus = {
  currentStep: InitStep;
  progress: number; // 0-100
  error: string | null;
  message: string;
};

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
  private initStatus: InitStatus = {
    currentStep: "starting",
    progress: 0,
    error: null,
    message: "Starting application...",
  };

  constructor() {
    super();
    this.store = new Store({
      schema: APP_CONFIG_SCHEMA,
    });
  }

  // Initialize app configuration
  async initialize() {
    try {
      logger.info("Starting AppConfig initialization");

      this.updateInitStatus({
        currentStep: "starting",
        progress: 0,
        message: "Loading application configuration...",
      });

      // Ensure we're properly loaded from the store
      logger.info(`Configuration loaded from: ${this.store.path}`);

      this.updateInitStatus({
        currentStep: "config_loaded",
        progress: 20,
        message: "Verifying application paths...",
      });

      // Verify paths
      await this.ensureLibraryPath();
      logger.info(`Library path verified: ${this.get("libraryPath")}`);

      this.updateInitStatus({
        currentStep: "paths_verified",
        progress: 40,
        message: "Checking user login status...",
      });

      // Check if user is already logged in
      const user = this.currentUser();
      if (user) {
        logger.info(`User found: ${user.name || user.id}`);
        this.updateInitStatus({
          currentStep: "user_loaded",
          progress: 80,
          message: "User authenticated, initializing database...",
        });

        // Emit user login event
        this.emit("user:login", user.id);
      } else {
        logger.info("No authenticated user found");
        this.updateInitStatus({
          currentStep: "user_loaded",
          progress: 80,
          message: "No user logged in.",
        });
      }

      // Initialization complete
      this.updateInitStatus({
        currentStep: "ready",
        progress: 100,
        message: "Application ready.",
      });

      logger.info("AppConfig initialized successfully");
      return true;
    } catch (error) {
      logger.error("Failed to initialize AppConfig", error);
      this.updateInitStatus({
        currentStep: "starting",
        progress: 0,
        error: error instanceof Error ? error.message : String(error),
        message: "Error initializing application.",
      });
      return false;
    }
  }

  private updateInitStatus(updates: Partial<InitStatus>) {
    this.initStatus = { ...this.initStatus, ...updates };

    logger.debug(
      `Init status update: ${this.initStatus.currentStep} - ${this.initStatus.message} (${this.initStatus.progress}%)`
    );

    // Broadcast status to all windows
    try {
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows.forEach((window) => {
          if (!window.isDestroyed()) {
            window.webContents.send("app-init-status", this.initStatus);
          }
        });
        logger.debug(`Broadcast init status to ${windows.length} windows`);
      } else {
        logger.debug("No windows available to broadcast init status");
      }
    } catch (error) {
      logger.error("Failed to broadcast init status", error);
    }
  }

  getInitStatus() {
    return this.initStatus;
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

    const existingSession = sessions.find(
      (s: UserType) => s.id === currentUser.id
    );
    if (existingSession) return;

    this.set("sessions", [...sessions, currentUser]);
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
    ipcMain.handle("appConfig:initStatus", () => this.getInitStatus());

    logger.info("AppConfig IPC handlers set up");
  }
}

const appConfig = new AppConfig();

export default appConfig;
