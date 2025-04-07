import { InitPhase } from "@main/core/plugin/phase-registry";
import log from "@main/services/logger";
import path from "path";
import ipcRegistry from "@main/ipc/ipc-registry";
import { setupIpcHandlers } from "@main/core/ipc-handlers";

// Configure logger
const logger = log.scope("IpcSetupPhase");

/**
 * Initialization phase that sets up the IPC system
 */
export class IpcSetupPhase implements InitPhase {
  readonly id = "ipc-setup";
  readonly name = "IPC System Setup";
  readonly description =
    "Sets up the IPC system for inter-process communication";
  readonly dependencies: string[] = []; // No dependencies, this is an early phase
  readonly timeout = 5000; // 5 seconds timeout

  async execute(): Promise<void> {
    logger.info("Setting up IPC system");

    try {
      // Use the centralized setup function
      await setupIpcHandlers();

      // Log registered modules
      const modules = ipcRegistry.getModuleNames();
      logger.info(
        `IPC system initialized with ${modules.length} modules: ${modules.join(", ")}`
      );

      // Generate preload API if in development mode
      if (process.env.NODE_ENV === "development") {
        try {
          const { default: PreloadApiGenerator } = await import(
            "@main/ipc/preload-generator"
          );

          const outputPath = path.join(
            __dirname,
            "../../../../generated/preload-api.ts"
          );
          await PreloadApiGenerator.generatePreloadApi(outputPath);
          logger.info(`Generated preload API at ${outputPath}`);
        } catch (error) {
          logger.warn("Failed to generate preload API:", error);
          // Non-fatal error, continue initialization
        }
      }
    } catch (error) {
      logger.error("Failed to set up IPC system:", error);
      throw error;
    }
  }
}

// Export the phase
export default new IpcSetupPhase();
