import { app, BrowserWindow } from "electron";
import path from "path";
import log from "@main/services/logger";
import appInitializer from "@main/core/initializer/app-initializer";
import { registerInitializerPhases } from "@main/core/initializer/register-phases";

// Configure logger
const logger = log.scope("MainAppLoader");

/**
 * Main app loader that initializes the application
 */
export class MainAppLoader {
  async loadApp(): Promise<void> {
    logger.info("Starting application initialization");

    try {
      // Register all initialization phases
      registerInitializerPhases();

      // Run the initialization process
      await appInitializer.initialize();

      logger.info("Application initialization completed successfully");
    } catch (error) {
      logger.error("Application initialization failed:", error);
      // You might want to show an error window or exit the app
    }
  }
}

// Export singleton for easy access
export const mainAppLoader = new MainAppLoader();
export default mainAppLoader;
