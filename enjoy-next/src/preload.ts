// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

// Import the generated API
import {
  AppconfigAPI,
  DbAPI,
  WindowAPI,
  ShellAPI,
  AppinitializerAPI,
} from "@generated/preload-api";

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

// Create the events API - this isn't part of the generated API
const eventsAPI = {
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
};

// Combine the generated API with our extensions and backward compatibility layer
const combinedAPI = {
  // Core APIs from the generated API
  initializer: AppinitializerAPI,
  appConfig: AppconfigAPI,
  db: DbAPI,
  window: WindowAPI,
  shell: ShellAPI,

  // Add events API
  events: eventsAPI,
};

// Expose the combined API to the renderer process
contextBridge.exposeInMainWorld("EnjoyAPI", combinedAPI);

// Log which API version is being used
console.log(
  "EnjoyAPI initialized with generated API structure and backward compatibility"
);
