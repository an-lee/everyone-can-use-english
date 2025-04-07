import { BaseIpcModule, IpcMethod } from "@main/core/ipc/base-ipc-module";
import appInitializer from "@main/core/initializer/app-initializer";
import log from "@main/services/logger";

// Configure logger
const logger = log.scope("AppInitializerIpc");

/**
 * IPC Module for App Initializer
 * Provides methods to get initialization status
 */
export class AppInitializerIpcModule extends BaseIpcModule {
  constructor() {
    super("AppInitializer", "app-initializer");
    logger.debug("AppInitializerIpcModule created");
  }

  /**
   * Get current initialization status
   * @returns The current initialization status object
   */
  @IpcMethod()
  async status() {
    logger.debug("Status method called");
    return appInitializer.getStatusForIpc();
  }
}

// Create and export singleton instance
export const appInitializerIpcModule = new AppInitializerIpcModule();
export default appInitializerIpcModule;
