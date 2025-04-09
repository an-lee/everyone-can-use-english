import { log } from "@main/core";
import { ipcRegistry } from "@main/ipc/core";
import { PreloadApiManager } from "@main/ipc/preload";

import {
  // Import regular IPC modules
  regularIpcModules,
  // Import entity IPC modules
  entityIpcModules,
} from "@main/ipc/modules";
import { app } from "electron";

const logger = log.scope("ipc-handlers");

/**
 * Set up all IPC handlers for the application
 */
export const setupIpcHandlers = async () => {
  logger.info("Setting up IPC handlers");

  // Register regular modules directly
  ipcRegistry.addModule(regularIpcModules);

  // Initialize entity IPC modules
  await setupEntityIpcModules();

  // Generate preload API if needed during development
  if (!app.isPackaged) {
    // Use PreloadApiManager instead of direct generation
    await PreloadApiManager.generatePreloadApi();
    logger.info("Generated preload API via PreloadApiManager");
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
  entityIpcModules.forEach((module) => module.initialize());

  logger.info("Entity IPC modules setup complete");
};

/**
 * Clean up all IPC handlers
 */
export const cleanupIpcHandlers = () => {
  logger.info("Cleaning up IPC handlers");

  // Clean up entity modules
  entityIpcModules.forEach((module) => module.dispose());

  // Clear registry
  ipcRegistry.clear();

  logger.info("IPC handlers cleanup complete");
};
