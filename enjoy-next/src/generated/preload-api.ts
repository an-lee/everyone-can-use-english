// Auto-generated preload API for Electron IPC
// DO NOT EDIT DIRECTLY - Generated on 2025-04-09T02:27:56.014Z
import { ipcRenderer } from "electron";

// AppConfig API
export const AppconfigAPI = {
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
};

// AppInitializer API
export const AppinitializerAPI = {
  status: () => ipcRenderer.invoke("appInitializer:status"),
};

// Database API
export const DbAPI = {
  connect: () => ipcRenderer.invoke("db:connect"),
  disconnect: () => ipcRenderer.invoke("db:disconnect"),
  backup: () => ipcRenderer.invoke("db:backup"),
  status: () => ipcRenderer.invoke("db:status"),
  migrate: () => ipcRenderer.invoke("db:migrate"),
  audio: {
    findAll: (options?: AudioSearchOptions) =>
      ipcRenderer.invoke("db:audio:findAll", options),
    findById: (id: string) => ipcRenderer.invoke("db:audio:findById", id),
    findByMd5: (md5: string) => ipcRenderer.invoke("db:audio:findByMd5", md5),
    create: (data: Partial<AudioEntity>) =>
      ipcRenderer.invoke("db:audio:create", data),
    update: (id: string, data: Partial<AudioEntity>) =>
      ipcRenderer.invoke("db:audio:update", id, data),
    delete: (id: string) => ipcRenderer.invoke("db:audio:delete", id),
    count: () => ipcRenderer.invoke("db:audio:count"),
  },
  transcription: {
    findByTarget: (targetId: string, targetType: string) =>
      ipcRenderer.invoke("db:transcription:findByTarget", targetId, targetType),
    findByMd5: (targetMd5: string) =>
      ipcRenderer.invoke("db:transcription:findByMd5", targetMd5),
    create: (data: Partial<TranscriptionEntity>) =>
      ipcRenderer.invoke("db:transcription:create", data),
    update: (id: string, data: Partial<TranscriptionEntity>) =>
      ipcRenderer.invoke("db:transcription:update", id, data),
    delete: (id: string) => ipcRenderer.invoke("db:transcription:delete", id),
    count: () => ipcRenderer.invoke("db:transcription:count"),
  },
};

// PluginModule API
export const PluginAPI = {
  getAll: () => ipcRenderer.invoke("plugin:getAll"),
  get: (pluginId: string) => ipcRenderer.invoke("plugin:get", pluginId),
};

// Window API
export const WindowAPI = {
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
};

// Shell API
export const ShellAPI = {
  openExternal: (url: string) => ipcRenderer.invoke("shell:openExternal", url),
  openPath: (path: string) => ipcRenderer.invoke("shell:openPath", path),
};
