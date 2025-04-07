import log from "@main/services/logger";
import windowIpcModule from "@main/core/ipc/modules/window-ipc";
import shellIpcModule from "@main/core/ipc/modules/shell-ipc";
import appConfigIpcModule from "@main/config/app-config-ipc";
import pluginIpcModule from "@main/core/plugin/plugin-ipc";

const logger = log.scope("ipc-handlers");

/**
 * Set up all IPC handlers for the application
 */
export const setupIpcHandlers = async () => {
  logger.info("Setting up IPC handlers");

  // Setup app configuration handlers
  appConfigIpcModule.registerHandlers();

  // Setup shell handlers
  shellIpcModule.registerHandlers();

  // Setup window handlers
  windowIpcModule.registerHandlers();
  windowIpcModule.registerWindowStateListeners();

  // Setup plugin handlers
  pluginIpcModule.registerHandlers();

  logger.info("IPC handlers setup complete");
};
