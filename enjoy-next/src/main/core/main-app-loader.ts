import log from "@main/core/utils/logger";
import {
  appInitializer,
  registerInitializerPhases,
  registerPluginSystemPhases,
  phaseRegistry,
} from "@main/core/app/initialization";

// Configure logger
const logger = log.scope("MainAppLoader");

/**
 * Main app loader that initializes the application
 */
export class MainAppLoader {
  async loadApp(): Promise<void> {
    logger.info("Starting application initialization");

    try {
      // Register core initialization phases
      registerInitializerPhases();

      // Register plugin system phases
      registerPluginSystemPhases();

      // Register default system phases (config, database, etc)
      phaseRegistry.registerDefaultPhases();

      logger.info(
        `Total registered phases: ${phaseRegistry.getPhases().length}`
      );

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
