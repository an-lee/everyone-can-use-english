import { app } from "electron";
import log from "@main/services/logger";
import ipcRegistry from "./ipc/ipc-registry";
import windowIpcModule from "./ipc/modules/window-ipc";
import { IpcChannels } from "@shared/ipc/ipc-channels";

const logger = log.scope("ipc-handlers");

/**
 * Set up all IPC handlers for the application
 */
export const setupIpcHandlers = async () => {
  logger.info("Setting up IPC handlers");

  // Setup app configuration handlers
  const { default: appConfigIpcModule } = await import(
    "@main/config/app-config-ipc"
  );
  appConfigIpcModule.registerHandlers();

  // Setup shell handlers
  ipcRegistry.register(IpcChannels.SHELL.OPEN_EXTERNAL, (_event, url) => {
    return import("electron").then(({ shell }) => shell.openExternal(url));
  });

  ipcRegistry.register(IpcChannels.SHELL.OPEN_PATH, (_event, path) => {
    return import("electron").then(({ shell }) => shell.openPath(path));
  });

  // Setup window handlers
  windowIpcModule.registerHandlers();
  windowIpcModule.setupWindowStateListeners();

  // Setup plugin handlers - this will be refactored to its own module later
  setupPluginIpcHandlers();

  logger.info("IPC handlers setup complete");
};

/**
 * Set up all IPC handlers for plugin system
 * TODO: Refactor to a plugin IPC module
 */
const setupPluginIpcHandlers = () => {
  // Get all plugins
  ipcRegistry.register(IpcChannels.PLUGINS.GET, async () => {
    const { default: pluginManager } = await import(
      "@/main/core/plugin/plugin-manager"
    );
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
  ipcRegistry.register(
    IpcChannels.PLUGINS.EXECUTE_COMMAND,
    async (_event, commandId, ...args) => {
      logger.info(`Executing command: ${commandId}`);
      try {
        const { executeCommand } = await import(
          "@/main/core/plugin/plugin-context"
        );
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
  import("electron").then(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      if (window.webContents) {
        window.webContents.send(channel, ...args);
      }
    });
  });
}

/**
 * Send event to main window
 */
export function sendToMainWindow(channel: string, ...args: any[]) {
  import("electron").then(({ BrowserWindow }) => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send(channel, ...args);
    }
  });
}
