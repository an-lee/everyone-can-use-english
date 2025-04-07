import { log } from "@main/core";
import { ipcRegistry } from "@main/ipc/core";
import { PreloadApiGenerator } from "@main/ipc/preload";

// Import all IPC modules directly
import {
  appConfigIpcModule,
  appInitializerIpcModule,
  dbIpcModule,
  pluginIpcModule,
  windowIpcModule,
  shellIpcModule,
} from "@main/ipc/modules";
import path from "path";
import { app } from "electron";

const logger = log.scope("ipc-handlers");

/**
 * Set up all IPC handlers for the application
 */
export const setupIpcHandlers = async () => {
  logger.info("Setting up IPC handlers");

  // Register modules directly
  ipcRegistry.addModule([
    appConfigIpcModule,
    appInitializerIpcModule,
    dbIpcModule,
    pluginIpcModule,
    windowIpcModule,
    shellIpcModule,
  ]);

  // Explicitly generate entity handlers for preload
  await dbIpcModule.generateEntityHandlersForPreload();
  logger.info("Entity handlers generated for preload API");

  // Generate preload API if needed
  if (!app.isPackaged) {
    // Use consistent path with preload-api-manager.ts
    const outputPath = path.join(
      process.cwd(),
      "src",
      "generated",
      "preload-api.ts"
    );

    // Generate the preload API
    await PreloadApiGenerator.generatePreloadApi(outputPath);
    logger.info(`Generated preload API at ${outputPath}`);
  }

  logger.info(
    `IPC handlers setup complete. Registered modules: ${ipcRegistry.getModuleNames().join(", ")}`
  );
};

/**
 * Clean up all IPC handlers
 */
export const cleanupIpcHandlers = () => {
  logger.info("Cleaning up IPC handlers");
  ipcRegistry.clear();
  logger.info("IPC handlers cleanup complete");
};
