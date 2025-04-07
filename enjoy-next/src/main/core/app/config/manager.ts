import { BehaviorSubject, Observable, distinctUntilChanged, map } from "rxjs";
import { AppConfigState, ProxyConfig } from "./types";
import { UserType } from "@renderer/api";
import {
  configStore,
  ensureLibraryPath,
  getCachePath,
  getDbPath,
  getLibraryPath,
  getUserDataPath,
  getConfigFilePath,
} from "./store";
import path from "path";
import fs from "fs-extra";
import { log } from "@main/core/utils";

const logger = log.scope("AppConfig");

class AppConfig {
  private isInitialized: boolean = false;

  // State subjects
  private state$: BehaviorSubject<AppConfigState>;

  constructor() {
    this.state$ = new BehaviorSubject<AppConfigState>(this.getInitialState());
  }

  private getInitialState(): AppConfigState {
    return {
      libraryPath: configStore.get("libraryPath"),
      webApiUrl: configStore.get("webApiUrl"),
      wsUrl: configStore.get("wsUrl"),
      proxy: configStore.get("proxy") as ProxyConfig,
      user: (configStore.get("user") as UserType) || null,
      sessions: (configStore.get("sessions") as UserType[]) || [],
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
    configStore.set(key, value);

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
      logger.info(`Configuration loaded from: ${configStore.path}`);

      // Verify paths
      await ensureLibraryPath();
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
    // First validate the user object
    if (!user.id) {
      throw new Error("User id is required");
    }

    logger.info(`Setting user: ${user.id}`);

    // Store the full user object
    configStore.set("user", {
      id: user.id,
      name: user.name || `User ${user.id}`,
      avatarUrl: user.avatarUrl || null,
      accessToken: user.accessToken || null,
    });

    // Update state and emit
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      user: configStore.get("user"),
    });

    logger.info(`User ${user.id} logged in successfully`);
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
    configStore.delete("user");

    // Update state
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      user: null,
    });
  }

  // Path helpers
  libraryPath(): string {
    return getLibraryPath();
  }

  userDataPath(subPath: string = ""): string | null {
    if (!this.currentUser()) return null;
    return getUserDataPath(Number(this.currentUser()!.id), subPath);
  }

  dbPath(): string | null {
    if (!this.currentUser()) return null;
    return getDbPath(Number(this.currentUser()!.id));
  }

  cachePath(): string {
    return getCachePath();
  }

  file(): string {
    return getConfigFilePath();
  }
}

const appConfig = new AppConfig();
export default appConfig;
