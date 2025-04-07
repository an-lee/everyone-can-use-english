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
    GET: "plugins:get",
    EXECUTE_COMMAND: "command:execute",
  },

  // App initializer channels
  APP_INITIALIZER: {
    STATUS: "app-initializer:status",
  },

  // Add more channel categories as needed...
} as const;

// Type for IPC channel strings
export type IpcChannelType =
  (typeof IpcChannels)[keyof typeof IpcChannels][keyof (typeof IpcChannels)[keyof typeof IpcChannels]];
