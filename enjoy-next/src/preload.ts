// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

// Import EnjoyAPI from auto-generated file
// In development, you would use a path like:
// import { EnjoyAPI } from './generated/preload-api';
// For this example, we'll continue to use the manual implementation

// Define allowed IPC event channels
const validChannels = [
  "plugin:loaded",
  "plugin:activated",
  "plugin:deactivated",
  "command:executed",
  "view:registered",
  "on-lookup",
  "on-translate",
  "window-state-changed",
  "db-state-changed",
  "app-init-status",
] as const;

// Expose protected methods that allow the renderer process to use IPC with the main process
contextBridge.exposeInMainWorld("EnjoyAPI", {
  // App config API
  appConfig: {
    get: (key: string) => ipcRenderer.invoke("appConfig:get", key),
    set: (key: string, value: any) =>
      ipcRenderer.invoke("appConfig:set", key, value),
    file: () => ipcRenderer.invoke("appConfig:file"),
    libraryPath: () => ipcRenderer.invoke("appConfig:libraryPath"),
    currentUser: () => ipcRenderer.invoke("appConfig:currentUser"),
    logout: () => ipcRenderer.invoke("appConfig:logout"),
    userDataPath: (subPath?: string) =>
      ipcRenderer.invoke("appConfig:userDataPath", subPath),
    dbPath: () => ipcRenderer.invoke("appConfig:dbPath"),
    cachePath: () => ipcRenderer.invoke("appConfig:cachePath"),
  },

  // App initializer API
  initializer: {
    getStatus: () => ipcRenderer.invoke("app-initializer:status"),
  },

  // Database API
  db: {
    connect: () => ipcRenderer.invoke("db:connect"),
    disconnect: () => ipcRenderer.invoke("db:disconnect"),
    backup: () => ipcRenderer.invoke("db:backup"),
    migrate: () => ipcRenderer.invoke("db:migrate"),
    status: () => ipcRenderer.invoke("db:status"),
  },

  // Audio API
  audio: {
    findAll: (options?: { page?: number; limit?: number; search?: string }) =>
      ipcRenderer.invoke("db:audioFindAll", options),
    findById: (id: string) => ipcRenderer.invoke("db:audioFindById", id),
    findByMd5: (md5: string) => ipcRenderer.invoke("db:audioFindByMd5", md5),
    create: (data: any) => ipcRenderer.invoke("db:audioCreate", data),
    update: (id: string, data: any) =>
      ipcRenderer.invoke("db:audioUpdate", id, data),
    delete: (id: string) => ipcRenderer.invoke("db:audioDelete", id),
  },

  // Shell API
  shell: {
    openExternal: (url: string) =>
      ipcRenderer.invoke("shell:openExternal", url),
    openPath: (path: string) => ipcRenderer.invoke("shell:openPath", path),
  },

  // Window API
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),
    isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  },

  // Plugins API
  plugins: {
    getPlugins: () => ipcRenderer.invoke("plugin:getAll"),
    executeCommand: (commandId: string, ...args: any[]) =>
      ipcRenderer.invoke("plugin:executeCommand", commandId, ...args),
  },

  // Events API
  events: {
    on: (
      channel: (typeof validChannels)[number],
      listener: (...args: any[]) => void
    ) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => listener(...args));
      }
    },
    off: (
      channel: (typeof validChannels)[number],
      listener: (...args: any[]) => void
    ) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, listener);
      }
    },
    once: (
      channel: (typeof validChannels)[number],
      listener: (...args: any[]) => void
    ) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.once(channel, (event, ...args) => listener(...args));
      }
    },
  },
});

// In your actual implementation, you would:
// 1. Use process.env.NODE_ENV to determine whether to use the auto-generated API
// 2. Import the auto-generated API in development mode
// 3. Fall back to this manual implementation in production if needed

/*
// Example of how you might integrate the auto-generated API:
try {
  const generatedApiPath = process.env.NODE_ENV === 'development' 
    ? './generated/preload-api'
    : `${app.getPath('userData')}/generated/preload-api`;
    
  const { EnjoyAPI } = require(generatedApiPath);
  contextBridge.exposeInMainWorld("EnjoyAPI", EnjoyAPI);
} catch (error) {
  console.error('Failed to load auto-generated API, using fallback', error);
  // Fall back to the manual implementation above
}
*/
