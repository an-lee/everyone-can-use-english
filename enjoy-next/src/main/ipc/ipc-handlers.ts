import log from "@/main/core/utils/logger";
import path from "path";
import { fileURLToPath } from "url";
import ipcRegistry from "@main/ipc/ipc-registry";
import PreloadApiGenerator from "@main/ipc/preload-generator";

// Import all IPC modules directly
import {
  appConfigIpcModule,
  appInitializerIpcModule,
  dbIpcModule,
  pluginIpcModule,
  windowIpcModule,
  shellIpcModule,
} from "@main/ipc/modules";

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

  // Generate preload API if needed
  if (process.env.GENERATE_PRELOAD_API === "true") {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const outputPath = path.join(__dirname, "../../generated/preload-api.ts");
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
