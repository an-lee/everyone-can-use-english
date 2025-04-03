// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

// Define the shape of our exposed API
interface EnjoyAPI {
  appConfig: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    file: () => Promise<string>;
    libraryPath: () => Promise<string>;
    currentUser: () => Promise<any>;
    userDataPath: (subPath: string) => Promise<string>;
    dbPath: () => Promise<string>;
    cachePath: () => Promise<string>;
  };
  plugins: {
    getPlugins: () => Promise<any[]>;
    executeCommand: (commandId: string, ...args: any[]) => Promise<any>;
  };
  events: {
    on: (channel: string, listener: (...args: any[]) => void) => void;
    off: (channel: string, listener: (...args: any[]) => void) => void;
    once: (channel: string, listener: (...args: any[]) => void) => void;
  };
}

// Allowed IPC channels for events
const validChannels = [
  "plugin:loaded",
  "plugin:activated",
  "plugin:deactivated",
  "command:executed",
  "view:registered",
  "on-lookup",
  "on-translate",
];

// Expose protected methods that allow the renderer process to use IPC with the main process
contextBridge.exposeInMainWorld("enjoy", {
  appConfig: {
    get: (key: string) => ipcRenderer.invoke("appConfig:get", key),
    set: (key: string, value: any) =>
      ipcRenderer.invoke("appConfig:set", key, value),
    file: () => ipcRenderer.invoke("appConfig:file"),
    libraryPath: () => ipcRenderer.invoke("appConfig:libraryPath"),
    currentUser: () => ipcRenderer.invoke("appConfig:currentUser"),
    userDataPath: (subPath?: string) =>
      ipcRenderer.invoke("appConfig:userDataPath", subPath),
    dbPath: () => ipcRenderer.invoke("appConfig:dbPath"),
    cachePath: () => ipcRenderer.invoke("appConfig:cachePath"),
  },
  plugins: {
    getPlugins: () => ipcRenderer.invoke("plugins:get"),
    executeCommand: (commandId: string, ...args: any[]) =>
      ipcRenderer.invoke("command:execute", commandId, ...args),
  },
  events: {
    on: (channel: string, listener: (...args: any[]) => void) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => listener(...args));
      }
    },
    off: (channel: string, listener: (...args: any[]) => void) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, listener);
      }
    },
    once: (channel: string, listener: (...args: any[]) => void) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.once(channel, (event, ...args) => listener(...args));
      }
    },
  },
} as EnjoyAPI);
