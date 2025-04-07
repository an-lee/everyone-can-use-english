import { ipcMain } from "electron";
import { IpcHandler, IpcHandlerRegistration } from "@shared/ipc/ipc-channels";
import log from "@main/services/logger";
import path from "path";
import fs from "fs";
import { BaseIpcModule } from "./base-ipc-module";

const logger = log.scope("IpcRegistry");

/**
 * Registry to manage all IPC handlers in the application
 */
class IpcRegistry {
  private registeredHandlers: Map<string, IpcHandler> = new Map();
  private modules: Map<string, BaseIpcModule> = new Map();

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
   * Register a module instance
   */
  addModule(module: BaseIpcModule): void {
    const moduleName = module.getModuleName();
    this.modules.set(moduleName, module);
    module.registerHandlers();
    logger.info(`Added module: ${moduleName}`);
  }

  /**
   * Auto-discover and register all IPC modules in a directory
   *
   * @param dirPath Path to directory containing IPC modules
   * @param recursive Whether to search recursively
   */
  async discoverAndRegisterModules(
    dirPath: string,
    recursive: boolean = true
  ): Promise<void> {
    logger.info(`Discovering IPC modules in: ${dirPath}`);
    const files = await this.getFiles(dirPath, recursive);
    const ipcModuleFiles = files.filter(
      (file) => file.endsWith("-ipc.js") || file.endsWith("-ipc.ts")
    );

    logger.info(`Found ${ipcModuleFiles.length} potential IPC module files`);

    for (const file of ipcModuleFiles) {
      try {
        const modulePath = file.replace(/\\/g, "/");
        // Use dynamic import to load the module
        const moduleExport = await import(modulePath);

        // Most modules export a default instance
        if (
          moduleExport.default &&
          moduleExport.default instanceof BaseIpcModule
        ) {
          this.addModule(moduleExport.default);
        }
        // Some might export a class that needs instantiation
        else {
          // Look for exported classes that extend BaseIpcModule
          for (const [key, value] of Object.entries(moduleExport)) {
            if (
              key.endsWith("IpcModule") &&
              typeof value === "function" &&
              Object.getPrototypeOf(value.prototype) === BaseIpcModule.prototype
            ) {
              const ModuleClass = value as new () => BaseIpcModule;
              const instance = new ModuleClass();
              this.addModule(instance);
              break;
            }
          }
        }
      } catch (error) {
        logger.error(`Failed to load IPC module from ${file}:`, error);
      }
    }

    logger.info(`Registered ${this.modules.size} IPC modules`);
  }

  /**
   * Get all files in a directory, optionally recursively
   */
  private async getFiles(dir: string, recursive: boolean): Promise<string[]> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    const files = await Promise.all(
      entries.map(async (entry) => {
        const res = path.resolve(dir, entry.name);
        if (entry.isDirectory() && recursive) {
          return await this.getFiles(res, recursive);
        }
        return res;
      })
    );

    return files.flat();
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
   * Remove a module and all its handlers
   */
  removeModule(moduleName: string): boolean {
    const module = this.modules.get(moduleName);
    if (!module) {
      logger.warn(`No module found with name: ${moduleName}`);
      return false;
    }

    module.unregisterHandlers();
    this.modules.delete(moduleName);
    logger.info(`Removed module: ${moduleName}`);
    return true;
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
   * Get all registered module names
   */
  getModuleNames(): string[] {
    return Array.from(this.modules.keys());
  }

  /**
   * Get all metadata for registered handlers
   * This is useful for generating documentation or type definitions
   */
  getAllMethodsMetadata(): Array<{
    module: string;
    name: string;
    channel: string;
    metadata: any;
  }> {
    const result: Array<{
      module: string;
      name: string;
      channel: string;
      metadata: any;
    }> = [];

    for (const [moduleName, module] of this.modules.entries()) {
      const moduleMetadata = module.getMethodsMetadata();

      for (const method of moduleMetadata) {
        result.push({
          module: moduleName,
          ...method,
        });
      }
    }

    return result;
  }

  /**
   * Remove all registered handlers
   */
  clear(): void {
    // Unregister all modules first
    for (const [moduleName, module] of this.modules.entries()) {
      module.unregisterHandlers();
      logger.debug(`Unregistered module: ${moduleName}`);
    }
    this.modules.clear();

    // Then clean up any remaining handlers
    for (const channel of this.registeredHandlers.keys()) {
      ipcMain.removeHandler(channel);
    }
    this.registeredHandlers.clear();

    logger.info("Cleared all registered IPC handlers and modules");
  }
}

// Singleton instance
const ipcRegistry = new IpcRegistry();

export default ipcRegistry;
