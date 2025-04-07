import { ipcMain } from "electron";
import { IpcHandler, IpcHandlerRegistration } from "@shared/ipc/ipc-channels";
import log from "@main/services/logger";

const logger = log.scope("IpcRegistry");

/**
 * Registry to manage all IPC handlers in the application
 */
class IpcRegistry {
  private registeredHandlers: Map<string, IpcHandler> = new Map();

  /**
   * Register an IPC handler
   * @param channel The IPC channel name
   * @param handler The handler function
   * @returns true if registered successfully, false if already registered
   */
  register(channel: string, handler: IpcHandler): boolean {
    if (this.registeredHandlers.has(channel)) {
      logger.warn(`IPC handler for channel '${channel}' is already registered`);
      return false;
    }

    try {
      ipcMain.handle(channel, handler);
      this.registeredHandlers.set(channel, handler);
      logger.debug(`Registered IPC handler for channel: ${channel}`);
      return true;
    } catch (error) {
      logger.error(
        `Failed to register IPC handler for channel: ${channel}`,
        error
      );
      return false;
    }
  }

  /**
   * Register multiple IPC handlers at once
   * @param handlers Array of handler registrations
   * @returns Number of successfully registered handlers
   */
  registerBulk(handlers: IpcHandlerRegistration[]): number {
    let successCount = 0;

    for (const { channel, handler } of handlers) {
      if (this.register(channel, handler)) {
        successCount++;
      }
    }

    logger.info(`Registered ${successCount}/${handlers.length} IPC handlers`);
    return successCount;
  }

  /**
   * Register handlers from a module
   * @param moduleName Name of the module for logging
   * @param handlers Object with handler methods
   * @param prefix Optional prefix for channel names
   */
  registerModule(
    moduleName: string,
    handlers: Record<string, IpcHandler>,
    prefix: string = ""
  ): void {
    const registrations: IpcHandlerRegistration[] = [];

    for (const [methodName, handler] of Object.entries(handlers)) {
      if (typeof handler === "function") {
        const channel = prefix ? `${prefix}:${methodName}` : methodName;
        registrations.push({ channel, handler });
      }
    }

    const count = this.registerBulk(registrations);
    logger.info(`Registered ${count} IPC handlers for module: ${moduleName}`);
  }

  /**
   * Remove an IPC handler
   * @param channel The IPC channel name
   * @returns true if removed successfully, false if not found
   */
  unregister(channel: string): boolean {
    if (!this.registeredHandlers.has(channel)) {
      logger.warn(`No IPC handler found for channel: ${channel}`);
      return false;
    }

    try {
      ipcMain.removeHandler(channel);
      this.registeredHandlers.delete(channel);
      logger.debug(`Unregistered IPC handler for channel: ${channel}`);
      return true;
    } catch (error) {
      logger.error(
        `Failed to unregister IPC handler for channel: ${channel}`,
        error
      );
      return false;
    }
  }

  /**
   * Check if a channel has a registered handler
   * @param channel The IPC channel name
   * @returns true if a handler is registered, false otherwise
   */
  hasHandler(channel: string): boolean {
    return this.registeredHandlers.has(channel);
  }

  /**
   * Get all registered handler channel names
   * @returns Array of channel names
   */
  getRegisteredChannels(): string[] {
    return Array.from(this.registeredHandlers.keys());
  }

  /**
   * Remove all registered handlers
   */
  clear(): void {
    for (const channel of this.registeredHandlers.keys()) {
      ipcMain.removeHandler(channel);
    }

    this.registeredHandlers.clear();
    logger.info("Cleared all registered IPC handlers");
  }
}

// Singleton instance
const ipcRegistry = new IpcRegistry();

export default ipcRegistry;
