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
  PluginConfigOptions,
} from "./types";
import * as i18n from "i18next";
import { ConfigStore } from "./config-store";
import { ElectronSettingsProvider } from "./electron-settings-provider";
import { DatabaseProvider } from "./database-provider";
import { type Sequelize } from "sequelize-typescript";
import { PluginConfigRegistry } from "./plugin-config-registry";
import { PluginConfigManager } from "./plugin-config-manager";
import snakeCase from "lodash/snakeCase";
import camelCase from "lodash/camelCase";

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

  // Plugin configuration registry
  private pluginRegistry: PluginConfigRegistry;

  constructor() {
    // Initialize with defaults
    this.appSettings = { ...DEFAULT_APP_SETTINGS };

    // Create app config store with electron-settings provider
    this.appStore = new ConfigStore({
      name: "app-settings",
      schema: APP_SETTINGS_SCHEMA,
      storage: new ElectronSettingsProvider(),
    });

    // Create plugin configuration registry
    this.pluginRegistry = new PluginConfigRegistry();

    // Load app settings from file
    this.loadAppSettings();

    // Ensure directories exist
    this.ensureDirectories();
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
    logger.debug(`getUserSetting: ${key}`);
    if (!this.isUserSettingsLoaded) {
      throw new Error("User settings not loaded");
    }

    try {
      // Try to get the value from the database first
      if (this.userStore) {
        // Convert camelCase to snake_case for database lookup
        const dbKey = snakeCase(key);

        logger.debug(`Looking up setting in database with key: ${dbKey}`);
        const dbValue = await this.userStore.getValue(dbKey);

        if (dbValue !== undefined) {
          logger.debug(`Found value in database for ${key}:`, dbValue);
          return {
            value: dbValue as UserSettings[K],
            source: ConfigSource.DATABASE,
            timestamp: Date.now(),
          };
        }
      }

      // Handle nested properties
      if (key.toString().includes(".")) {
        const parts = key.toString().split(".");
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

      // Return from in-memory cache or default
      logger.debug(`Using in-memory value for ${key}:`, this.userSettings[key]);
      return {
        value: this.userSettings[key] ?? this.getDefaultUserSetting(key),
        source:
          this.userSettings[key] !== undefined
            ? ConfigSource.DATABASE
            : ConfigSource.DEFAULT,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error(`Error getting user setting ${key}:`, error);
      return {
        value: this.getDefaultUserSetting(key),
        source: ConfigSource.DEFAULT,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Set user setting value
   */
  async setUserSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ): Promise<void> {
    logger.debug(`setUserSetting: ${key}`, value);
    if (!this.isUserSettingsLoaded) {
      throw new Error("User settings not loaded");
    }

    // Initialize user settings if null
    if (!this.userSettings) {
      this.userSettings = { ...DEFAULT_USER_SETTINGS };
    }

    try {
      // Handle nested properties
      if (key.toString().includes(".")) {
        const parts = key.toString().split(".");
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
          // Convert camelCase to snake_case for database storage
          const dbKey = snakeCase(parentKey);

          logger.debug(
            `Saving nested property to database with key: ${dbKey}`,
            parentValue
          );
          await this.userStore.set(dbKey, parentValue);
        }

        return;
      }

      // Update user settings in memory
      this.userSettings[key] = value;

      // Save to database using the new config store
      if (this.userStore) {
        // Convert camelCase to snake_case for database storage
        const dbKey = snakeCase(key);

        logger.debug(`Saving to database with key: ${dbKey}`, value);
        await this.userStore.set(dbKey, value);
      }

      // Special handling for language change
      if (key === "language") {
        await i18n.changeLanguage(value as string);
      }
    } catch (error) {
      logger.error(`Error setting user setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Register a plugin configuration
   */
  registerPluginConfig(options: PluginConfigOptions): PluginConfigManager {
    return this.pluginRegistry.register(options);
  }

  /**
   * Unregister a plugin configuration
   */
  unregisterPluginConfig(pluginId: string): void {
    this.pluginRegistry.unregister(pluginId);
  }

  /**
   * Get a plugin configuration manager
   */
  getPluginConfig(pluginId: string): PluginConfigManager | undefined {
    return this.pluginRegistry.getPlugin(pluginId);
  }

  /**
   * Get all registered plugin IDs
   */
  getPluginIds(): string[] {
    return this.pluginRegistry.getPluginIds();
  }

  /**
   * Get the full configuration
   */
  async getConfig(): Promise<Config> {
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
  async loadUserSettings(db: Sequelize): Promise<void> {
    logger.info("Loading user settings from database");

    // Initialize user settings with defaults
    this.userSettings = { ...DEFAULT_USER_SETTINGS };

    this.userStore = new ConfigStore({
      name: "user-settings",
      schema: USER_SETTINGS_SCHEMA,
      storage: new DatabaseProvider(db, "UserSetting", USER_SETTINGS_SCHEMA),
    });

    try {
      // Load each user setting
      for (const key of Object.keys(USER_SETTINGS_SCHEMA)) {
        logger.debug(`Loading user setting: ${key}`);
        const value = await this.userStore.getValue(key);
        logger.debug(`Loaded value for ${key}:`, value);

        if (value !== undefined) {
          logger.debug(`Setting value for ${key}:`, value);
          this.setUserSettingFromValue(key as keyof UserSettings, value);
        } else {
          logger.debug(`No value found for ${key}, using default`);
        }
      }

      logger.debug("User settings after loading:", this.userSettings);
      this.isUserSettingsLoaded = true;

      // Initialize plugin registry
      await this.pluginRegistry.initialize(db);
    } catch (error) {
      logger.error("Failed to load user settings from database", error);
      this.isUserSettingsLoaded = false;
    }
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
   * Verify that user settings are properly loaded from the database
   * This is a diagnostic function that can be called after loadUserSettings
   */
  async verifyUserSettings(): Promise<void> {
    if (!this.isUserSettingsLoaded || !this.userStore) {
      logger.error("Cannot verify user settings - not loaded");
      return;
    }

    logger.info("Verifying user settings...");

    // Check each user setting
    for (const key of Object.keys(USER_SETTINGS_SCHEMA)) {
      try {
        // Convert camelCase to snake_case for database lookup
        const dbKey = snakeCase(key);

        // Get value from in-memory cache
        const memoryValue = this.userSettings[key as keyof UserSettings];

        // Get value from config store
        const storeValue = await this.userStore.getValue(dbKey);

        logger.info(`Setting ${key} (${dbKey}):`, {
          memory: memoryValue,
          store: storeValue,
          default: USER_SETTINGS_SCHEMA[key].default,
        });
      } catch (error) {
        logger.error(`Error verifying setting ${key}:`, error);
      }
    }
  }

  /**
   * Force reload user settings from the database
   */
  async reloadUserSettings(): Promise<void> {
    if (!this.userStore) {
      logger.error("Cannot reload user settings - store not initialized");
      return;
    }

    logger.info("Reloading user settings from database");

    try {
      // Reset user settings to defaults
      this.userSettings = { ...DEFAULT_USER_SETTINGS };

      // Load each user setting
      for (const key of Object.keys(USER_SETTINGS_SCHEMA)) {
        // Convert camelCase to snake_case for database lookup
        const dbKey = snakeCase(key);

        logger.debug(`Reloading user setting: ${key} (${dbKey})`);

        try {
          const value = await this.userStore.getValue(dbKey);
          if (value !== undefined) {
            logger.debug(`Reloaded value for ${key}:`, value);
            this.setUserSettingFromValue(key as keyof UserSettings, value);
          } else {
            logger.debug(`No value found for ${key}, using default`);
          }
        } catch (error) {
          logger.error(`Failed to reload setting ${key}:`, error);
        }
      }

      logger.debug("User settings after reloading:", this.userSettings);
      this.isUserSettingsLoaded = true;

      logger.info("User settings reloaded successfully");
    } catch (error) {
      logger.error("Failed to reload user settings from database", error);
    }
  }

  /**
   * Get a user setting directly from the database (for debugging)
   */
  async getUserSettingDirect(key: string): Promise<any> {
    try {
      // Get the UserSetting model from the database
      const db = await import("@main/db").then((module) => module.default);
      if (!db.connection) {
        logger.error("Database not connected");
        return null;
      }

      // Import the UserSetting model directly
      const { UserSetting } = await import("@main/db/models");

      // Convert camelCase to snake_case for database lookup
      const dbKey = snakeCase(key);

      logger.info(`Getting user setting directly from database: ${dbKey}`);
      const result = await UserSetting.get(dbKey);
      logger.info(`Direct database result for ${dbKey}:`, result);

      return result;
    } catch (error) {
      logger.error(`Error getting user setting directly: ${key}`, error);
      return null;
    }
  }

  /**
   * Force initialize user settings with values from the database
   * This is a last resort method to fix issues with user settings
   */
  async forceInitializeUserSettings(): Promise<void> {
    logger.info("Force initializing user settings from database");

    try {
      // Import the UserSetting model directly
      const { UserSetting } = await import("@main/db/models");

      // Reset user settings to defaults
      this.userSettings = { ...DEFAULT_USER_SETTINGS };

      // Get all user settings from the database
      const allSettings = await UserSetting.findAll();
      logger.info(`Found ${allSettings.length} settings in database`);

      // Process each setting
      for (const setting of allSettings) {
        try {
          const key = setting.key;
          let value;

          // Parse the value if it's JSON
          try {
            value = JSON.parse(setting.value);
          } catch {
            value = setting.value;
          }

          logger.info(`Loading setting from database: ${key}`, value);

          // Convert snake_case to camelCase
          const camelKey = camelCase(key);

          // Set the value in memory
          if (camelKey.includes(".")) {
            // Handle nested properties
            const parts = camelKey.split(".");
            const parentKey = parts[0] as keyof UserSettings;
            const childKey = parts.slice(1).join(".");

            // Get parent value
            let parentValue = this.userSettings[parentKey];
            if (!parentValue || typeof parentValue !== "object") {
              parentValue = {} as any;
            }

            // Set nested property
            this.setNestedProperty(parentValue, childKey, value);

            // Update user settings
            this.userSettings[parentKey] = parentValue as any;
          } else if (camelKey in this.userSettings) {
            // Set direct property
            (this.userSettings as any)[camelKey] = value;
          }
        } catch (error) {
          logger.error(`Failed to process setting ${setting.key}`, error);
        }
      }

      this.isUserSettingsLoaded = true;
      logger.info("User settings force initialized successfully");
    } catch (error) {
      logger.error("Failed to force initialize user settings", error);
    }
  }

  /**
   * Set a nested property in an object
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const parts = path.split(".");
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
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
      "config-get-user-setting-direct",
      async (_event: any, key: string) => {
        return await this.getUserSettingDirect(key);
      }
    );

    ipcMain.handle(
      "config-set-user-setting",
      async (_event: any, key: string, value: any) => {
        await this.setUserSetting(key as any, value);
      }
    );

    ipcMain.handle("config-reload-user-settings", async () => {
      await this.reloadUserSettings();
      return true;
    });

    ipcMain.handle("config-force-initialize-user-settings", async () => {
      await this.forceInitializeUserSettings();
      return true;
    });

    // Plugin settings
    ipcMain.handle(
      "config-get-plugin-setting",
      async (_event: any, pluginId: string, key: string) => {
        const plugin = this.getPluginConfig(pluginId);
        if (!plugin) {
          throw new Error(`Plugin ${pluginId} not found`);
        }
        return await plugin.getValue(key);
      }
    );

    ipcMain.handle(
      "config-set-plugin-setting",
      async (_event: any, pluginId: string, key: string, value: any) => {
        const plugin = this.getPluginConfig(pluginId);
        if (!plugin) {
          throw new Error(`Plugin ${pluginId} not found`);
        }
        await plugin.set(key, value);
      }
    );

    ipcMain.handle("config-get-plugin-ids", () => {
      return this.getPluginIds();
    });

    // Full config
    ipcMain.handle("config-get", async () => {
      return this.getConfig();
    });
  }
}
