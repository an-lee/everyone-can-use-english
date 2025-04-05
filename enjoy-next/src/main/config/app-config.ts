import Store from "electron-store";
import {
  WS_URL,
  WEB_API_URL,
  LIBRARY_PATH_SUFFIX,
  DATABASE_NAME,
  USER_DATA_SUB_PATH,
} from "@shared/constants";
import path from "path";
import { app, ipcMain, IpcMainInvokeEvent } from "electron";
import fs from "fs-extra";

const APP_CONFIG_SCHEMA = {
  appearance: {
    type: "object",
    properties: {
      theme: { type: "string", default: "system" },
      fontSize: { type: "number", default: 16 },
      language: { type: "string", default: "zh-CN" },
    },
  },
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
      host: { type: "string" },
      port: { type: "number" },
    },
  },
  user: {
    type: "object",
    properties: {
      id: { type: "string" },
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
        id: { type: "string" },
        name: { type: "string" },
        avatarUrl: { type: "string" },
        accessToken: { type: "string" },
      },
    },
  },
};

class AppConfig {
  private store: any;

  constructor() {
    this.store = new Store({
      schema: APP_CONFIG_SCHEMA,
    });

    this.ensureLibraryPath();
  }

  get(key: keyof typeof APP_CONFIG_SCHEMA | string) {
    return this.store.get(key);
  }

  set(key: keyof typeof APP_CONFIG_SCHEMA | string, value: any) {
    this.store.set(key, value);
  }

  file() {
    return this.store.path;
  }

  currentUser() {
    return this.get("user");
  }

  rememberUser(session: UserType) {
    const sessions = this.get("sessions");
    const existingSession = sessions.find((s: UserType) => s.id === session.id);
    if (existingSession) {
      this.set(
        "sessions",
        sessions.filter((s: UserType) => s.id !== session.id)
      );
    }
    this.set("sessions", [...sessions, session]);
  }

  ensureLibraryPath() {
    const libraryPath = this.get("libraryPath");
    if (path.parse(libraryPath).base !== LIBRARY_PATH_SUFFIX) {
      return path.join(libraryPath, LIBRARY_PATH_SUFFIX);
    }

    fs.ensureDirSync(libraryPath);
    this.set("libraryPath", libraryPath);
    return libraryPath;
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
    ipcMain.handle(
      "appConfig:get",
      (
        _event: IpcMainInvokeEvent,
        key: keyof typeof APP_CONFIG_SCHEMA | string
      ) => {
        return this.get(key);
      }
    );

    ipcMain.handle(
      "appConfig:set",
      (
        _event: IpcMainInvokeEvent,
        key: keyof typeof APP_CONFIG_SCHEMA | string,
        value: any
      ) => {
        this.set(key, value);
      }
    );

    ipcMain.handle("appConfig:file", (_event: IpcMainInvokeEvent) => {
      return this.file();
    });

    ipcMain.handle("appConfig:libraryPath", (_event: IpcMainInvokeEvent) => {
      return this.libraryPath();
    });

    ipcMain.handle("appConfig:currentUser", (_event: IpcMainInvokeEvent) => {
      return this.currentUser();
    });

    ipcMain.handle(
      "appConfig:rememberUser",
      (_event: IpcMainInvokeEvent, session: UserType) => {
        this.rememberUser(session);
      }
    );

    ipcMain.handle(
      "appConfig:userDataPath",
      (_event: IpcMainInvokeEvent, subPath: string = "") => {
        return this.userDataPath(subPath);
      }
    );

    ipcMain.handle("appConfig:dbPath", (_event: IpcMainInvokeEvent) => {
      return this.dbPath();
    });

    ipcMain.handle("appConfig:cachePath", (_event: IpcMainInvokeEvent) => {
      return this.cachePath();
    });
  }
}

const appConfig = new AppConfig();

export default appConfig;
