import { ipcRenderer } from "electron";

export const PluginEvents = [
  "plugin:loaded",
  "plugin:activated",
  "plugin:deactivated",
  "command:executed",
  "view:registered",
] as const;

export interface PluginsAPI {
  getPlugins: () => Promise<any[]>;
  executeCommand: (commandId: string, ...args: any[]) => Promise<any>;
}

export const PluginsAPI: PluginsAPI = {
  getPlugins: () => ipcRenderer.invoke("plugins:get"),
  executeCommand: (commandId: string, ...args: any[]) =>
    ipcRenderer.invoke("command:execute", commandId, ...args),
};
