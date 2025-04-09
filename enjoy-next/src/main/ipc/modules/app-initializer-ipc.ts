import { BaseIpcModule, IpcMethod } from "@main/ipc/modules/base-ipc-module";
import { appInitializer, log } from "@main/core";

// Configure logger
const logger = log.scope("AppInitializerIpc");

/**
 * IPC Module for App Initializer
 * Provides methods to get initialization status
 */
export class AppInitializerIpcModule extends BaseIpcModule {
  constructor() {
    super("AppInitializer", "appInitializer");
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
