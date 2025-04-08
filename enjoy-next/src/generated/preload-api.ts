// Auto-generated preload API for Electron IPC
// DO NOT EDIT DIRECTLY - Generated on 2025-04-08T02:05:33.011Z
import { ipcRenderer } from 'electron';

// Define necessary types
export interface DbState {
  state: string;
  message?: string;
}

export interface EnjoyAPI {
  appConfig: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    file: () => Promise<string>;
    libraryPath: () => Promise<string>;
    currentUser: () => Promise<any>;
    logout: () => Promise<void>;
    userDataPath: (subPath?: string) => Promise<string | null>;
    dbPath: () => Promise<string | null>;
    cachePath: () => Promise<string>;
  };
  appInitializer: {
    status: () => Promise<any>;
  };
  db: {
    connect: () => Promise<DbState>;
    disconnect: () => Promise<{ state: 'disconnected' }>;
    backup: () => Promise<{ state: 'backup-completed' }>;
    status: () => Promise<DbState>;
    migrate: () => Promise<object>;
    audio: {
      findAll: () => Promise<Promise<any>>;
      findById: () => Promise<Promise<any>>;
      findByMd5: () => Promise<Promise<any>>;
      create: () => Promise<Promise<any>>;
      update: () => Promise<Promise<any>>;
      delete: () => Promise<Promise<any>>;
      count: () => Promise<Promise<any>>;
    };
  };
  plugin: {
    getAll: () => Promise<any[]>;
    get: (pluginId: string) => Promise<any>;
  };
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
    openPath: (path: string) => Promise<string>;
  };
}

// AppConfig API
export const AppConfigAPI = {
  get: (key: string) => ipcRenderer.invoke('appConfig:get', key),
  set: (key: string, value: any) => ipcRenderer.invoke('appConfig:set', key, value),
  file: () => ipcRenderer.invoke('appConfig:file'),
  libraryPath: () => ipcRenderer.invoke('appConfig:libraryPath'),
  currentUser: () => ipcRenderer.invoke('appConfig:currentUser'),
  logout: () => ipcRenderer.invoke('appConfig:logout'),
  userDataPath: (subPath?: string) => ipcRenderer.invoke('appConfig:userDataPath', subPath),
  dbPath: () => ipcRenderer.invoke('appConfig:dbPath'),
  cachePath: () => ipcRenderer.invoke('appConfig:cachePath'),
};

// AppInitializer API
export const AppInitializerAPI = {
  status: () => ipcRenderer.invoke('app-initializer:status'),
};

// Database API
export const DbAPI = {
  connect: () => ipcRenderer.invoke('db:connect'),
  disconnect: () => ipcRenderer.invoke('db:disconnect'),
  backup: () => ipcRenderer.invoke('db:backup'),
  status: () => ipcRenderer.invoke('db:status'),
  migrate: () => ipcRenderer.invoke('db:migrate'),
  audio: {
    findAll: () => ipcRenderer.invoke('db:audio:findAll'),
    findById: () => ipcRenderer.invoke('db:audio:findById'),
    findByMd5: () => ipcRenderer.invoke('db:audio:findByMd5'),
    create: () => ipcRenderer.invoke('db:audio:create'),
    update: () => ipcRenderer.invoke('db:audio:update'),
    delete: () => ipcRenderer.invoke('db:audio:delete'),
    count: () => ipcRenderer.invoke('db:audio:count'),
  },
};

// PluginModule API
export const PluginAPI = {
  getAll: () => ipcRenderer.invoke('plugin:getAll'),
  get: (pluginId: string) => ipcRenderer.invoke('plugin:get', pluginId),
};

// Window API
export const WindowAPI = {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
};

// Shell API
export const ShellAPI = {
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
};

