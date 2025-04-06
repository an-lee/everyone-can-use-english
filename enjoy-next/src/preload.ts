// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";
import { AppConfigAPI } from "./preload/app-config-api";
import { PluginEvents, PluginsAPI } from "./preload/plugins-api";
// Define the shape of our exposed API
export interface EnjoyAPI {
  appConfig: typeof AppConfigAPI;
  plugins: typeof PluginsAPI;
  shell: {
    openExternal: (url: string) => Promise<void>;
    openPath: (path: string) => Promise<void>;
  };
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
  };
  events: {
    on: (channel: string, listener: (...args: any[]) => void) => void;
    off: (channel: string, listener: (...args: any[]) => void) => void;
    once: (channel: string, listener: (...args: any[]) => void) => void;
  };
}

// Allowed IPC channels for events
const validChannels = [...PluginEvents, "on-lookup", "on-translate"] as const;

// Expose protected methods that allow the renderer process to use IPC with the main process
contextBridge.exposeInMainWorld("EnjoyAPI", {
  appConfig: AppConfigAPI,
  shell: {
    openExternal: (url: string) =>
      ipcRenderer.invoke("shell:openExternal", url),
    openPath: (path: string) => ipcRenderer.invoke("shell:openPath", path),
  },
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),
  },
  plugins: PluginsAPI,
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
} as EnjoyAPI);
