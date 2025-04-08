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
  // Import entity IPC modules
  dbAudioIpcModule,
  // Add new entity modules here
} from "@main/ipc/modules";
import path from "path";
import { app } from "electron";

const logger = log.scope("ipc-handlers");

/**
 * Set up all IPC handlers for the application
 */
export const setupIpcHandlers = async () => {
  logger.info("Setting up IPC handlers");

  // Register regular modules directly
  ipcRegistry.addModule([
    appConfigIpcModule,
    appInitializerIpcModule,
    dbIpcModule,
    pluginIpcModule,
    windowIpcModule,
    shellIpcModule,
  ]);

  // Initialize entity IPC modules
  await setupEntityIpcModules();

  // Generate preload API if needed
  if (!app.isPackaged) {
    // Use consistent path with preload-api-manager.ts
    const outputPath = path.join(
      process.cwd(),
      "src",
      "main",
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
 * Set up entity IPC modules
 */
const setupEntityIpcModules = async () => {
  logger.info("Setting up entity IPC modules");

  // Initialize each entity module
  dbAudioIpcModule.initialize();
  // Add new entity modules initialization here

  logger.info("Entity IPC modules setup complete");
};

/**
 * Clean up all IPC handlers
 */
export const cleanupIpcHandlers = () => {
  logger.info("Cleaning up IPC handlers");

  // Clean up entity modules
  dbAudioIpcModule.dispose();
  // Add new entity modules cleanup here

  // Clear registry
  ipcRegistry.clear();

  logger.info("IPC handlers cleanup complete");
};
