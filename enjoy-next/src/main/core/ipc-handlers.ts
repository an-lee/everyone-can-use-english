import {
  ipcMain,
  BrowserWindow,
  IpcMainInvokeEvent,
  shell,
  app,
} from "electron";
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

  // Window control
  ipcMain.handle("window:minimize", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) window.minimize();
  });

  ipcMain.handle("window:maximize", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
      // Notify renderer about window state change
      setTimeout(() => {
        if (window && !window.isDestroyed()) {
          window.webContents.send("window-state-changed", window.isMaximized());
        }
      }, 100);
    }
  });

  ipcMain.handle("window:close", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) window.close();
  });

  ipcMain.handle("window:isMaximized", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    return window ? window.isMaximized() : false;
  });

  // Set up window state change listeners for all windows
  setupWindowStateListeners();
};

/**
 * Set up window state change listeners
 */
const setupWindowStateListeners = () => {
  // Listen for new windows being created
  app.on("browser-window-created" as any, (_: any, window: BrowserWindow) => {
    // Listen for maximize/unmaximize events
    window.on("maximize", () => {
      if (!window.isDestroyed()) {
        window.webContents.send("window-state-changed", true);
      }
    });

    window.on("unmaximize", () => {
      if (!window.isDestroyed()) {
        window.webContents.send("window-state-changed", false);
      }
    });
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
