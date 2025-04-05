import { ipcMain, BrowserWindow, IpcMainInvokeEvent, shell } from "electron";
import pluginManager from "@main/core/plugin-manager";
import { executeCommand } from "@main/core/plugin-context";
import log from "@main/services/logger";
import appConfig from "@main/config/app-config";
const logger = log.scope("ipc-handlers");

/**
 * Set up all IPC handlers
 */
export const setupIpcHandlers = () => {
  appConfig.setupIpcHandlers();
  setupPluginIpcHandlers();

  // Shell
  ipcMain.handle("shell:openExternal", (_event, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle("shell:openPath", (_event, path) => {
    shell.openPath(path);
  });
};

/**
 * Set up all IPC handlers for plugin system
 */
const setupPluginIpcHandlers = () => {
  // Get all plugins
  ipcMain.handle("plugins:get", async () => {
    const plugins = pluginManager.getAllPlugins();
    return plugins.map((plugin) => ({
      id: plugin.id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      description: plugin.manifest.description,
      author: plugin.manifest.author,
      isBuiltIn: plugin.isBuiltIn,
      lifecycle: plugin.lifecycle,
      contributes: plugin.manifest.contributes || {},
    }));
  });

  // Execute a command
  ipcMain.handle(
    "command:execute",
    async (_event: IpcMainInvokeEvent, commandId: string, ...args: any[]) => {
      logger.info(`Executing command: ${commandId}`);
      try {
        return await executeCommand(commandId, ...args);
      } catch (error) {
        logger.error(`Error executing command ${commandId}`, error);
        throw error;
      }
    }
  );
};

/**
 * Send event to all renderer windows
 */
export function sendToAllWindows(channel: string, ...args: any[]) {
  BrowserWindow.getAllWindows().forEach((window) => {
    if (window.webContents) {
      window.webContents.send(channel, ...args);
    }
  });
}

/**
 * Send event to main window
 */
export function sendToMainWindow(channel: string, ...args: any[]) {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows[0].webContents.send(channel, ...args);
  }
}
