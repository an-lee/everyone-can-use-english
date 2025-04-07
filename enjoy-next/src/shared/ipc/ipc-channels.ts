import { IpcMainInvokeEvent } from "electron";

/**
 * Type definitions for IPC handlers
 */
export type IpcHandler<T = any, R = any> = (
  event: IpcMainInvokeEvent,
  ...args: T[]
) => Promise<R> | R;

/**
 * Interface for registering IPC handlers
 */
export interface IpcHandlerRegistration {
  channel: string;
  handler: IpcHandler;
}

/**
 * Helper function to create entity channel names consistently
 */
function createEntityChannels<T extends Record<string, any>>(
  entityName: string,
  methods: string[]
): T {
  const channels: Record<string, string> = {};

  methods.forEach((method) => {
    const key = `${entityName.toUpperCase()}_${method.toUpperCase()}`;
    const channelName = `db:${entityName}${method.charAt(0).toUpperCase() + method.slice(1)}`;
    channels[key] = channelName;
  });

  return channels as T;
}

/**
 * All IPC channels in the application
 */
export const IpcChannels = {
  // App config channels
  APP_CONFIG: {
    GET: "appConfig:get",
    SET: "appConfig:set",
    FILE: "appConfig:file",
    LIBRARY_PATH: "appConfig:libraryPath",
    CURRENT_USER: "appConfig:currentUser",
    LOGOUT: "appConfig:logout",
    USER_DATA_PATH: "appConfig:userDataPath",
    DB_PATH: "appConfig:dbPath",
    CACHE_PATH: "appConfig:cachePath",
  },

  // Window control channels
  WINDOW: {
    MINIMIZE: "window:minimize",
    MAXIMIZE: "window:maximize",
    CLOSE: "window:close",
    IS_MAXIMIZED: "window:isMaximized",
    STATE_CHANGED: "window-state-changed",
  },

  // Shell channels
  SHELL: {
    OPEN_EXTERNAL: "shell:openExternal",
    OPEN_PATH: "shell:openPath",
  },

  // Plugin channels
  PLUGINS: {
    GET_ALL: "plugin:getAll",
    EXECUTE_COMMAND: "plugin:executeCommand",
  },

  // App initializer channels
  APP_INITIALIZER: {
    STATUS: "app-initializer:status",
  },

  // Database channels
  DB: {
    // Core database operations
    CONNECT: "db:connect",
    DISCONNECT: "db:disconnect",
    BACKUP: "db:backup",
    MIGRATE: "db:migrate",
    STATUS: "db:status",
    STATE_CHANGED: "db-state-changed",

    // Audio entity operations
    ...createEntityChannels<Record<string, string>>("audio", [
      "findAll",
      "findById",
      "findByMd5",
      "create",
      "update",
      "delete",
    ]),

    // Video entity operations
    ...createEntityChannels<Record<string, string>>("video", [
      "findAll",
      "findById",
      "create",
      "update",
      "delete",
    ]),

    // To add more entities, use createEntityChannels
  },

  // Add more channel categories as needed...
} as const;

// Type for IPC channel strings
export type IpcChannelType =
  (typeof IpcChannels)[keyof typeof IpcChannels][keyof (typeof IpcChannels)[keyof typeof IpcChannels]];
