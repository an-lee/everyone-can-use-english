import { InitPhase } from "@main/core/initializer/phase-registry";
import log from "@/main/core/utils/logger";
import path from "path";
import { fileURLToPath } from "url";
import { setupIpcHandlers } from "@main/ipc/ipc-handlers";

// Configure logger
const logger = log.scope("IpcSetupPhase");

/**
 * Phase to set up the IPC system
 */
export class IpcSetupPhase implements InitPhase {
  id = "ipc-setup";
  name = "IPC System Setup";
  description = "Sets up the IPC system for inter-process communication";
  dependencies = []; // No dependencies
  timeout = 10000; // 10 seconds

  /**
   * Set up the IPC system
   */
  async execute(): Promise<void> {
    logger.info("Setting up IPC system");

    try {
      // Set up IPC handlers
      await setupIpcHandlers();

      // Generate preload API in development mode if needed
      if (process.env.NODE_ENV === "development") {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const outputPath = path.join(
          __dirname,
          "../../../../generated/preload-api.ts"
        );

        const { default: PreloadApiGenerator } = await import(
          "@main/ipc/preload-generator"
        );
        await PreloadApiGenerator.generatePreloadApi(outputPath);
        logger.info(`Generated preload API at ${outputPath}`);
      }

      logger.info("IPC system setup completed successfully");
    } catch (error) {
      logger.error("Failed to set up IPC system:", error);
      throw error;
    }
  }
}

// Singleton instance
export const ipcSetupPhase = new IpcSetupPhase();
export default ipcSetupPhase;
