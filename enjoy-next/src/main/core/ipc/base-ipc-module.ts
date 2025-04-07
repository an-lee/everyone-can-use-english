import { IpcHandler } from "@shared/ipc/ipc-channels";
import ipcRegistry from "./ipc-registry";
import log from "@main/services/logger";

/**
 * Base class for modules that register IPC handlers
 */
export abstract class BaseIpcModule {
  protected readonly logger: any;
  private readonly moduleName: string;
  private readonly channelPrefix: string;

  /**
   * Create a new IPC module
   * @param moduleName Name of the module for logging
   * @param channelPrefix Prefix for IPC channel names
   */
  constructor(moduleName: string, channelPrefix: string = "") {
    this.moduleName = moduleName;
    this.channelPrefix = channelPrefix;
    this.logger = log.scope(`IpcModule:${moduleName}`);
  }

  /**
   * Register all handlers in this module
   */
  registerHandlers(): void {
    const methods = this.getHandlerMethods();
    ipcRegistry.registerModule(this.moduleName, methods, this.channelPrefix);
  }

  /**
   * Get all handler methods from this module
   * @returns Object with handler methods
   */
  private getHandlerMethods(): Record<string, IpcHandler> {
    const handlers: Record<string, IpcHandler> = {};
    const prototype = Object.getPrototypeOf(this);

    // Get all methods from the prototype
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) =>
        name !== "constructor" &&
        typeof prototype[name] === "function" &&
        !name.startsWith("_") // Exclude private methods
    );

    // Bind methods to this instance
    for (const methodName of methodNames) {
      handlers[methodName] = prototype[methodName].bind(this);
    }

    return handlers;
  }

  /**
   * Unregister all handlers in this module
   */
  unregisterHandlers(): void {
    const methods = this.getHandlerMethods();

    for (const methodName of Object.keys(methods)) {
      const channel = this.channelPrefix
        ? `${this.channelPrefix}:${methodName}`
        : methodName;

      ipcRegistry.unregister(channel);
    }

    this.logger.info("Unregistered all handlers");
  }
}

/**
 * Decorator to mark a method as an IPC handler
 * (For future TypeScript validation)
 */
export function IpcMethod() {
  return function (
    _target: any,
    _propertyKey: string,
    _descriptor: PropertyDescriptor
  ) {
    // This is just a marker decorator for now
    // Could be extended to add validation or metadata
  };
}
