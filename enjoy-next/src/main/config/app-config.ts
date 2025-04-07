import Store from "electron-store";
import {
  WS_URL,
  WEB_API_URL,
  LIBRARY_PATH_SUFFIX,
  DATABASE_NAME,
  USER_DATA_SUB_PATH,
} from "@shared/constants";
import path from "path";
import { app } from "electron";
import fs from "fs-extra";
import { UserType } from "@renderer/api";
import { BehaviorSubject, Observable, distinctUntilChanged, map } from "rxjs";
import log from "@main/services/logger";

const logger = log.scope("AppConfig");

// Config type definitions
export interface ProxyConfig {
  enabled: boolean;
  url?: string;
}

export interface AppConfigState {
  libraryPath: string;
  webApiUrl: string;
  wsUrl: string;
  proxy: ProxyConfig;
  user: UserType | null;
  sessions: UserType[];
}

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
    default: [],
  },
};

class AppConfig {
  private store: any;
  private isInitialized: boolean = false;

  // State subjects
  private state$: BehaviorSubject<AppConfigState>;

  constructor() {
    this.store = new Store({
      schema: APP_CONFIG_SCHEMA,
    });
    this.state$ = new BehaviorSubject<AppConfigState>(this.getInitialState());
  }

  private getInitialState(): AppConfigState {
    return {
      libraryPath: this.store.get("libraryPath") as string,
      webApiUrl: this.store.get("webApiUrl") as string,
      wsUrl: this.store.get("wsUrl") as string,
      proxy: this.store.get("proxy") as ProxyConfig,
      user: (this.store.get("user") as UserType) || null,
      sessions: (this.store.get("sessions") as UserType[]) || [],
    };
  }

  // Observable getters
  public getState$(): Observable<AppConfigState> {
    return this.state$.asObservable();
  }

  public getUser$(): Observable<UserType | null> {
    return this.state$.pipe(
      map((state) => state.user),
      distinctUntilChanged(
        (prev, curr) =>
          prev?.id === curr?.id && prev?.accessToken === curr?.accessToken
      )
    );
  }

  public getPath$(
    pathType: "library" | "userData" | "db" | "cache"
  ): Observable<string | null> {
    switch (pathType) {
      case "library":
        return this.state$.pipe(
          map((state) => state.libraryPath),
          distinctUntilChanged()
        );
      case "userData":
        return this.getUser$().pipe(
          map((user) => (user ? this.userDataPath() : null)),
          distinctUntilChanged()
        );
      case "db":
        return this.getUser$().pipe(
          map((user) => (user ? this.dbPath() : null)),
          distinctUntilChanged()
        );
      case "cache":
        return this.state$.pipe(
          map((state) => {
            const tmpDir = path.join(state.libraryPath, "cache");
            fs.ensureDirSync(tmpDir);
            return tmpDir;
          }),
          distinctUntilChanged()
        );
    }
  }

  // Get a specific config property as observable
  public get$<K extends keyof AppConfigState>(
    key: K
  ): Observable<AppConfigState[K]> {
    return this.state$.pipe(
      map((state) => state[key]),
      distinctUntilChanged()
    );
  }

  // Synchronous getters
  public get<K extends keyof AppConfigState>(key: K): AppConfigState[K] {
    return this.state$.getValue()[key];
  }

  // Update config and emit changes
  public set<K extends keyof AppConfigState>(
    key: K,
    value: AppConfigState[K]
  ): void {
    // Update store
    this.store.set(key, value);

    // Update state and emit
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      [key]: value,
    });

    logger.debug(`Config updated: ${String(key)} = ${JSON.stringify(value)}`);
  }

  // Initialize app configuration
  async initialize(): Promise<boolean> {
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

      // Reset state with verified paths
      this.state$.next(this.getInitialState());

      this.isInitialized = true;
      logger.info("AppConfig initialized successfully");
      return true;
    } catch (error) {
      logger.error("Failed to initialize AppConfig", error);
      return false;
    }
  }

  // User management
  public currentUser(): UserType | null {
    return this.get("user");
  }

  public login(user: UserType): void {
    this.set("user", user);
  }

  public logout(): void {
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

    // Delete user
    logger.info(`Logging out user: ${currentUser.id}`);
    this.store.delete("user");

    // Update state
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      user: null,
    });
  }

  async ensureLibraryPath(): Promise<string> {
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

  libraryPath(): string {
    return this.get("libraryPath");
  }

  userDataPath(subPath: string = ""): string | null {
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

  dbPath(): string | null {
    if (!this.userDataPath()) return null;

    const dbName = app.isPackaged
      ? `${DATABASE_NAME}.sqlite`
      : `${DATABASE_NAME}_dev.sqlite`;
    return path.join(this.userDataPath()!, dbName);
  }

  cachePath(): string {
    const tmpDir = path.join(this.get("libraryPath"), "cache");
    fs.ensureDirSync(tmpDir);
    return tmpDir;
  }

  file(): string {
    return this.store.path;
  }
}

const appConfig = new AppConfig();
export default appConfig;
