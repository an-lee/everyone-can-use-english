// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";
import { VALID_CHANNELS } from "@main/ipc/helpers";

// Import the generated API
import {
  AppconfigAPI,
  DbAPI,
  WindowAPI,
  ShellAPI,
  AppinitializerAPI,
} from "@generated/preload-api";

// Create the events API - this isn't part of the generated API
const eventsAPI = {
  on: (
    channel: (typeof VALID_CHANNELS)[number],
    listener: (...args: any[]) => void
  ) => {
    if (VALID_CHANNELS.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => listener(...args));
    }
  },
  off: (
    channel: (typeof VALID_CHANNELS)[number],
    listener: (...args: any[]) => void
  ) => {
    if (VALID_CHANNELS.includes(channel)) {
      ipcRenderer.removeListener(channel, listener);
    }
  },
  once: (
    channel: (typeof VALID_CHANNELS)[number],
    listener: (...args: any[]) => void
  ) => {
    if (VALID_CHANNELS.includes(channel)) {
      ipcRenderer.once(channel, (event, ...args) => listener(...args));
    }
  },
};

// Combine the generated API with our extensions and backward compatibility layer
const combinedAPI = {
  // Core APIs from the generated API
  appInitializer: AppinitializerAPI,
  appConfig: AppconfigAPI,
  db: DbAPI,
  window: WindowAPI,
  shell: ShellAPI,

  // Add events API
  events: eventsAPI,
};

// Expose the combined API to the renderer process
contextBridge.exposeInMainWorld("EnjoyAPI", combinedAPI);

declare global {
  interface Window {
    EnjoyAPI: typeof combinedAPI;
  }
}
