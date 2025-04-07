import log from "@main/services/logger";
import path from "path";
import ipcRegistry from "@main/ipc/ipc-registry";
import PreloadApiGenerator from "@main/ipc/preload-generator";

const logger = log.scope("ipc-handlers");

/**
 * Set up all IPC handlers for the application
 */
export const setupIpcHandlers = async () => {
  logger.info("Setting up IPC handlers");

  // Auto-discover and register all IPC modules
  const modulesDir = path.join(__dirname, "../");
  await ipcRegistry.discoverAndRegisterModules(modulesDir, true);

  // Generate preload API if needed
  if (process.env.GENERATE_PRELOAD_API === "true") {
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
