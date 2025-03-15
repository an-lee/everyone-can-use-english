import electronSettings from "electron-settings";
import { app, ipcMain } from "electron";
import path from "path";
import fs from "fs-extra";
import { UserSettingKeyEnum, SttEngineOptionEnum } from "@shared/types/enums";
import log from "@main/services/logger";
import {
  LIBRARY_PATH_SUFFIX,
  DATABASE_NAME,
  WEB_API_URL,
} from "@shared/constants";
import {
  AppSettings,
  UserSettings,
  Config,
  ConfigSource,
  ConfigValue,
  ConfigSchema,
} from "./types";
import * as i18n from "i18next";
import { ConfigStore } from "./config-store";
import { ElectronSettingsProvider } from "./electron-settings-provider";
import { DatabaseProvider } from "./database-provider";
import { type Sequelize } from "sequelize-typescript";

const logger = log.scope("ConfigManager");

// Default configurations
const DEFAULT_APP_SETTINGS: AppSettings = {
  library: path.join(app.getPath("documents"), LIBRARY_PATH_SUFFIX),
  apiUrl: WEB_API_URL,
  wsUrl: "",
  proxy: null,
  user: null,
  file: "",
};

const DEFAULT_USER_SETTINGS: UserSettings = {
  language: "zh-CN",
  nativeLanguage: "zh-CN",
  learningLanguage: "en-US",
  sttEngine: SttEngineOptionEnum.ENJOY_AZURE,
  whisper: "whisper-1",
  openai: {},
  gptEngine: {
    model: "gpt-4",
    temperature: 0.7,
    maxTokens: 2000,
  },
  recorder: {
    sampleRate: 44100,
    channels: 1,
    autoStop: true,
    autoStopTime: 2000,
  },
  hotkeys: {},
  profile: null,
};

// App settings schema
const APP_SETTINGS_SCHEMA: ConfigSchema = {
  library: {
    type: "string",
    default: DEFAULT_APP_SETTINGS.library,
    description: "Path to the library directory",
  },
  apiUrl: {
    type: "string",
    default: DEFAULT_APP_SETTINGS.apiUrl,
    description: "API URL for the web service",
  },
  wsUrl: {
    type: "string",
    default: DEFAULT_APP_SETTINGS.wsUrl,
    description: "WebSocket URL for the web service",
  },
  proxy: {
    type: "object",
    default: DEFAULT_APP_SETTINGS.proxy,
    description: "Proxy configuration",
  },
  user: {
    type: "object",
    default: DEFAULT_APP_SETTINGS.user,
    description: "Current user information",
  },
  file: {
    type: "string",
    default: DEFAULT_APP_SETTINGS.file,
    description: "Current file path",
  },
};

// User settings schema
const USER_SETTINGS_SCHEMA: ConfigSchema = {
  language: {
    type: "string",
    default: DEFAULT_USER_SETTINGS.language,
    description: "UI language",
  },
  nativeLanguage: {
    type: "string",
    default: DEFAULT_USER_SETTINGS.nativeLanguage,
    description: "Native language",
  },
  learningLanguage: {
    type: "string",
    default: DEFAULT_USER_SETTINGS.learningLanguage,
    description: "Learning language",
  },
  sttEngine: {
    type: "string",
    default: DEFAULT_USER_SETTINGS.sttEngine,
    description: "Speech-to-text engine",
  },
  whisper: {
    type: "string",
    default: DEFAULT_USER_SETTINGS.whisper,
    description: "Whisper model",
  },
  openai: {
    type: "object",
    default: DEFAULT_USER_SETTINGS.openai,
    description: "OpenAI configuration",
  },
  gptEngine: {
    type: "object",
    default: DEFAULT_USER_SETTINGS.gptEngine,
    description: "GPT engine configuration",
  },
  recorder: {
    type: "object",
    default: DEFAULT_USER_SETTINGS.recorder,
    description: "Recorder configuration",
  },
  hotkeys: {
    type: "object",
    default: DEFAULT_USER_SETTINGS.hotkeys,
    description: "Hotkey configuration",
  },
  profile: {
    type: "object",
    default: DEFAULT_USER_SETTINGS.profile,
    description: "User profile",
  },
};

export class ConfigManager {
  // Legacy properties for backward compatibility
  private appSettings: AppSettings;
  private userSettings: UserSettings | null = null;
  private isUserSettingsLoaded = false;

  // New config stores
  private appStore: ConfigStore;
  private userStore: ConfigStore | null = null;
  private databaseProvider: DatabaseProvider;

  constructor() {
    // Initialize with defaults
    this.appSettings = { ...DEFAULT_APP_SETTINGS };

    // Create app config store with electron-settings provider
    this.appStore = new ConfigStore({
      name: "app-settings",
      schema: APP_SETTINGS_SCHEMA,
      storage: new ElectronSettingsProvider(),
    });

    // Create database provider for user settings
    this.databaseProvider = new DatabaseProvider();

    // Load app settings from file
    this.loadAppSettings();

    // Ensure directories exist
    this.ensureDirectories();
  }

  /**
   * Initialize user settings from database
   * This should be called after the database is connected
   */
  async loadUserDatatbase(db: Sequelize): Promise<void> {
    // Set the database instance for the database provider
    this.databaseProvider.setDatabase(db);
    logger.info("Initialized database provider");

    // Create user config store with database provider
    this.userStore = new ConfigStore({
      name: "user-settings",
      schema: USER_SETTINGS_SCHEMA,
      storage: this.databaseProvider,
    });

    if (!this.isUserSettingsLoaded) {
      await this.loadUserSettings();
    }
  }

  async unloadUserDatatbase(): Promise<void> {
    this.userStore = null;
    this.isUserSettingsLoaded = false;
    this.databaseProvider.setDatabase(null);
  }

  /**
   * Get app setting value
   */
  getAppSetting<K extends keyof AppSettings>(
    key: K
  ): ConfigValue<AppSettings[K]> {
    // Handle nested properties
    if (key.includes(".")) {
      const parts = key.split(".");
      let value: any = this.appSettings;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
      }

      return {
        value: value ?? this.getDefaultAppSetting(key),
        source: value !== undefined ? ConfigSource.FILE : ConfigSource.DEFAULT,
        timestamp: Date.now(),
      };
    }

    return {
      value: this.appSettings[key] ?? this.getDefaultAppSetting(key),
      source:
        this.appSettings[key] !== undefined
          ? ConfigSource.FILE
          : ConfigSource.DEFAULT,
      timestamp: Date.now(),
    };
  }

  /**
   * Set app setting value
   */
  setAppSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): void {
    // Handle nested properties
    if (key.includes(".")) {
      const parts = key.split(".");
      const parentKey = parts[0] as keyof AppSettings;
      const childKey = parts.slice(1).join(".");

      // Get parent value
      let parentValue = this.appSettings[parentKey];
      if (!parentValue || typeof parentValue !== "object") {
        parentValue = {} as any;
      }

      // Set nested property
      let current: any = parentValue;
      const childParts = childKey.split(".");
      for (let i = 0; i < childParts.length - 1; i++) {
        const part = childParts[i];
        if (!current[part] || typeof current[part] !== "object") {
          current[part] = {};
        }
        current = current[part];
      }
      current[childParts[childParts.length - 1]] = value;

      // Update app settings
      this.appSettings[parentKey] = parentValue as any;

      // Save to electron-settings
      electronSettings.setSync(parentKey, parentValue);

      // Also update the new config store
      this.appStore.set(key as string, value).catch((error) => {
        logger.error(
          `Failed to set app setting "${key}" in config store`,
          error
        );
      });

      return;
    }

    // Update app settings
    this.appSettings[key] = value;

    // Save to electron-settings
    electronSettings.setSync(key, value);

    // Also update the new config store
    this.appStore.set(key as string, value).catch((error) => {
      logger.error(`Failed to set app setting "${key}" in config store`, error);
    });
  }

  /**
   * Get user setting value
   */
  async getUserSetting<K extends keyof UserSettings>(
    key: K
  ): Promise<ConfigValue<UserSettings[K]>> {
    if (!this.isUserSettingsLoaded) {
      await this.loadUserSettings();
    }

    if (!this.userSettings) {
      return {
        value: this.getDefaultUserSetting(key),
        source: ConfigSource.DEFAULT,
        timestamp: Date.now(),
      };
    }

    // Handle nested properties
    if (key.includes(".")) {
      const parts = key.split(".");
      let value: any = this.userSettings;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
      }

      return {
        value: value ?? this.getDefaultUserSetting(key),
        source:
          value !== undefined ? ConfigSource.DATABASE : ConfigSource.DEFAULT,
        timestamp: Date.now(),
      };
    }

    return {
      value: this.userSettings[key] ?? this.getDefaultUserSetting(key),
      source:
        this.userSettings[key] !== undefined
          ? ConfigSource.DATABASE
          : ConfigSource.DEFAULT,
      timestamp: Date.now(),
    };
  }

  /**
   * Set user setting value
   */
  async setUserSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ): Promise<void> {
    if (!this.isUserSettingsLoaded) {
      await this.loadUserSettings();
    }

    // Initialize user settings if null
    if (!this.userSettings) {
      this.userSettings = { ...DEFAULT_USER_SETTINGS };
    }

    // Handle nested properties
    if (key.includes(".")) {
      const parts = key.split(".");
      const parentKey = parts[0] as keyof UserSettings;
      const childKey = parts.slice(1).join(".");

      // Get parent value
      let parentValue = this.userSettings[parentKey];
      if (!parentValue || typeof parentValue !== "object") {
        parentValue = {} as any;
      }

      // Set nested property
      let current: any = parentValue;
      const childParts = childKey.split(".");
      for (let i = 0; i < childParts.length - 1; i++) {
        const part = childParts[i];
        if (!current[part] || typeof current[part] !== "object") {
          current[part] = {};
        }
        current = current[part];
      }
      current[childParts[childParts.length - 1]] = value;

      // Update user settings
      this.userSettings[parentKey] = parentValue as any;

      // Save to database using the new config store
      if (this.userStore) {
        await this.userStore.set(key as string, value);
      }

      return;
    }

    // Update user settings
    this.userSettings[key] = value;

    // Save to database using the new config store
    if (this.userStore) {
      await this.userStore.set(key as string, value);
    }

    // Special handling for language change
    if (key === "language") {
      await i18n.changeLanguage(value as string);
    }
  }

  /**
   * Get the full configuration
   */
  async getConfig(): Promise<Config> {
    if (!this.isUserSettingsLoaded) {
      await this.loadUserSettings();
    }

    return {
      ...this.appSettings,
      user: this.userSettings
        ? {
            ...this.userSettings,
            id: this.appSettings.user?.id,
          }
        : null,
      paths: {
        userData: this.userDataPath(),
        library: this.libraryPath(),
        cache: this.cachePath(),
        db: this.dbPath(),
      },
    };
  }

  /**
   * Get the library path
   */
  libraryPath(): string {
    return this.appSettings.library;
  }

  /**
   * Get the cache path
   */
  cachePath(): string {
    const tmpDir = path.join(this.libraryPath(), "cache");
    fs.ensureDirSync(tmpDir);
    return tmpDir;
  }

  /**
   * Get the user data path
   */
  userDataPath(): string | null {
    const userId = this.appSettings.user?.id;
    if (!userId) return null;

    const userData = path.join(this.libraryPath(), userId.toString());
    fs.ensureDirSync(userData);
    return userData;
  }

  /**
   * Get the database path
   */
  dbPath(): string | null {
    if (!this.userDataPath()) return null;

    const dbName = app.isPackaged
      ? `${DATABASE_NAME}.sqlite`
      : `${DATABASE_NAME}_dev.sqlite`;
    return path.join(this.userDataPath()!, dbName);
  }

  /**
   * Get the API URL
   */
  apiUrl(): string {
    return process.env.WEB_API_URL || this.appSettings.apiUrl;
  }

  /**
   * Get all user sessions
   */
  sessions(): { id: number; name: string }[] {
    const library = this.libraryPath();
    const sessions = fs.readdirSync(library).filter((dir) => {
      return dir.match(/^\d{8}$/);
    });
    return sessions.map((id) => ({ id: parseInt(id), name: id }));
  }

  /**
   * Load app settings from electron-settings
   */
  private loadAppSettings(): void {
    // Load library path
    const libraryFromSettings = electronSettings.getSync("library");
    if (libraryFromSettings && typeof libraryFromSettings === "string") {
      let libraryPath = libraryFromSettings;

      // Ensure library path ends with the correct suffix
      if (path.parse(libraryPath).base !== LIBRARY_PATH_SUFFIX) {
        libraryPath = path.join(libraryPath, LIBRARY_PATH_SUFFIX);
        electronSettings.setSync("library", libraryPath);
      }

      this.appSettings.library = libraryPath;
    } else {
      // Set default library path
      electronSettings.setSync("library", this.appSettings.library);
    }

    // Load API URL
    const apiUrl = electronSettings.getSync("apiUrl");
    if (apiUrl && typeof apiUrl === "string") {
      this.appSettings.apiUrl = apiUrl;
    } else {
      // Set default API URL
      electronSettings.setSync("apiUrl", this.appSettings.apiUrl);
    }

    // Load WebSocket URL
    const wsUrl = electronSettings.getSync("wsUrl");
    if (wsUrl && typeof wsUrl === "string") {
      this.appSettings.wsUrl = wsUrl;
    }

    // Load proxy settings
    const proxy = electronSettings.getSync("proxy");
    if (proxy) {
      this.appSettings.proxy = proxy as any;
    }

    // Load user settings
    const user = electronSettings.getSync("user");
    if (user) {
      this.appSettings.user = user as any;
    }

    // Load file path
    const file = electronSettings.getSync("file");
    if (file && typeof file === "string") {
      this.appSettings.file = file;
    }

    // Also load settings into the new config store
    for (const key of Object.keys(this.appSettings) as Array<
      keyof AppSettings
    >) {
      this.appStore.set(key, this.appSettings[key]).catch((error) => {
        logger.error(
          `Failed to set app setting "${key}" in config store`,
          error
        );
      });
    }
  }

  /**
   * Load user settings from database
   */
  private async loadUserSettings(): Promise<void> {
    // Initialize user settings with defaults
    this.userSettings = { ...DEFAULT_USER_SETTINGS };

    // If user store is available, load settings from it
    if (this.userStore) {
      try {
        // Load each user setting
        for (const key of Object.keys(USER_SETTINGS_SCHEMA)) {
          const value = await this.userStore.getValue(key);
          if (value !== undefined) {
            this.setUserSettingFromValue(key as keyof UserSettings, value);
          }
        }
      } catch (error) {
        logger.error("Failed to load user settings from database", error);
      }
    }

    this.isUserSettingsLoaded = true;
  }

  /**
   * Set user setting from database value
   */
  private setUserSettingFromValue(key: keyof UserSettings, value: any): void {
    // Handle nested properties
    if (key.includes(".")) {
      const parts = key.split(".");
      const parentKey = parts[0] as keyof UserSettings;
      const childKey = parts.slice(1).join(".");

      // Get parent value
      let parentValue = this.userSettings?.[parentKey];
      if (!parentValue || typeof parentValue !== "object") {
        parentValue = {} as any;
      }

      // Set nested property
      let current: any = parentValue;
      const childParts = childKey.split(".");
      for (let i = 0; i < childParts.length - 1; i++) {
        const part = childParts[i];
        if (!current[part] || typeof current[part] !== "object") {
          current[part] = {};
        }
        current = current[part];
      }
      current[childParts[childParts.length - 1]] = value;

      // Update user settings
      if (this.userSettings) {
        this.userSettings[parentKey] = parentValue as any;
      }

      return;
    }

    // Update user settings
    if (this.userSettings) {
      // Use type assertion to ensure type safety
      this.userSettings[key] = value as any;
    }
  }

  /**
   * Map a user setting key to UserSettingKeyEnum
   */
  private mapKeyToUserSettingEnum(key: string): UserSettingKeyEnum | null {
    // Handle nested properties
    const baseKey = key.split(".")[0];

    switch (baseKey) {
      case "language":
        return UserSettingKeyEnum.LANGUAGE;
      case "nativeLanguage":
        return UserSettingKeyEnum.NATIVE_LANGUAGE;
      case "learningLanguage":
        return UserSettingKeyEnum.LEARNING_LANGUAGE;
      case "sttEngine":
        return UserSettingKeyEnum.STT_ENGINE;
      case "whisper":
        return UserSettingKeyEnum.WHISPER;
      case "openai":
        return UserSettingKeyEnum.OPENAI;
      case "gptEngine":
        return UserSettingKeyEnum.GPT_ENGINE;
      case "recorder":
        return UserSettingKeyEnum.RECORDER;
      case "hotkeys":
        return UserSettingKeyEnum.HOTKEYS;
      case "profile":
        return UserSettingKeyEnum.PROFILE;
      default:
        return null;
    }
  }

  /**
   * Get default app setting value
   */
  private getDefaultAppSetting<K extends keyof AppSettings>(
    key: K
  ): AppSettings[K] {
    // Handle nested properties
    if (key.includes(".")) {
      const parts = key.split(".");
      let value: any = DEFAULT_APP_SETTINGS;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
      }
      return value;
    }

    return DEFAULT_APP_SETTINGS[key];
  }

  /**
   * Get default user setting value
   */
  private getDefaultUserSetting<K extends keyof UserSettings>(
    key: K
  ): UserSettings[K] {
    // Handle nested properties
    if (key.includes(".")) {
      const parts = key.split(".");
      let value: any = DEFAULT_USER_SETTINGS;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
      }
      return value;
    }

    return DEFAULT_USER_SETTINGS[key];
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    try {
      // Use direct property access instead of method calls to avoid circular dependencies
      fs.ensureDirSync(this.appSettings.library);

      // Create cache directory
      const cacheDir = path.join(this.appSettings.library, "cache");
      fs.ensureDirSync(cacheDir);

      // Create user data directories if user is set
      const userId = this.appSettings.user?.id;
      if (userId) {
        const userData = path.join(this.appSettings.library, userId.toString());
        fs.ensureDirSync(userData);
        fs.ensureDirSync(path.join(userData, "backup"));
        fs.ensureDirSync(path.join(userData, "speeches"));
        fs.ensureDirSync(path.join(userData, "recordings"));
      }
    } catch (error) {
      logger.error("Failed to ensure directories", error);
    }
  }

  /**
   * Register IPC handlers for configuration
   */
  registerIpcHandlers(): void {
    // Import ipcMain dynamically to avoid circular dependency
    ipcMain.handle("config-get-library", () => {
      return this.getAppSetting("library").value;
    });

    ipcMain.handle("config-get-user", () => {
      return this.getAppSetting("user").value;
    });

    ipcMain.handle(
      "config-set-user",
      (_event: any, user: AppSettings["user"]) => {
        this.setAppSetting("user", user);
      }
    );

    ipcMain.handle("config-get-user-data-path", () => {
      return this.userDataPath();
    });

    ipcMain.handle("config-get-api-url", () => {
      return this.getAppSetting("apiUrl").value;
    });

    ipcMain.handle("config-set-api-url", (_event: any, url: string) => {
      this.setAppSetting("apiUrl", url);
    });

    ipcMain.handle("config-get-sessions", () => {
      return this.sessions();
    });

    // User settings
    ipcMain.handle(
      "config-get-user-setting",
      async (_event: any, key: string) => {
        return (await this.getUserSetting(key as any)).value;
      }
    );

    ipcMain.handle(
      "config-set-user-setting",
      async (_event: any, key: string, value: any) => {
        await this.setUserSetting(key as any, value);
      }
    );

    // Full config
    ipcMain.handle("config-get", async () => {
      return this.getConfig();
    });

    // Add backward compatibility handlers for old IPC channels
    ipcMain.handle("app-settings-get-library", () => {
      return this.getAppSetting("library").value;
    });

    ipcMain.handle("app-settings-get-user", () => {
      return this.getAppSetting("user").value;
    });

    ipcMain.handle("app-settings-set-user", (_event: any, user: any) => {
      this.setAppSetting("user", user);
    });

    ipcMain.handle("app-settings-get-user-data-path", () => {
      return this.userDataPath();
    });

    ipcMain.handle("app-settings-get-api-url", () => {
      return this.getAppSetting("apiUrl").value;
    });

    ipcMain.handle("app-settings-set-api-url", (_event: any, url: string) => {
      this.setAppSetting("apiUrl", url);
    });

    ipcMain.handle("app-settings-get-sessions", () => {
      return this.sessions();
    });
  }
}
