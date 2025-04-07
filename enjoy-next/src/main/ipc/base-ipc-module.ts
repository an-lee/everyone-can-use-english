import "reflect-metadata";
import { IpcHandler } from "@shared/ipc/ipc-channels";
import ipcRegistry from "./ipc-registry";
import log from "@main/services/logger";

/**
 * Metadata for an IPC method
 */
export interface IpcMethodMetadata {
  description?: string;
  errorHandling?: "standard" | "custom" | "throw";
  requiresAuth?: boolean;
  parameters?: {
    name: string;
    type: string;
    description?: string;
    required?: boolean;
  }[];
  returns?: {
    type: string;
    description?: string;
  };
}

/**
 * Key for storing metadata on a method
 */
const IPC_METHOD_METADATA_KEY = Symbol("ipc:method:metadata");

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
        !name.startsWith("_") && // Exclude private methods
        Reflect.getMetadata(IPC_METHOD_METADATA_KEY, prototype, name) !==
          undefined // Only include decorated methods
    );

    // Bind methods to this instance and wrap with error handling if needed
    for (const methodName of methodNames) {
      const metadata: IpcMethodMetadata =
        Reflect.getMetadata(IPC_METHOD_METADATA_KEY, prototype, methodName) ||
        {};

      // Create wrapped handler with error handling based on metadata
      handlers[methodName] = this.createWrappedHandler(
        prototype[methodName].bind(this),
        methodName,
        metadata
      );
    }

    return handlers;
  }

  /**
   * Create a wrapped handler with error handling
   */
  private createWrappedHandler(
    handler: IpcHandler,
    methodName: string,
    metadata: IpcMethodMetadata
  ): IpcHandler {
    return async (event, ...args) => {
      try {
        return await handler(event, ...args);
      } catch (error) {
        // How to handle the error depends on the metadata
        const errorHandling = metadata.errorHandling || "standard";

        if (errorHandling === "throw") {
          // Just rethrow the error
          throw error;
        } else if (errorHandling === "standard") {
          // Log and return a standardized error object
          this.logger.error(
            `Error in ${this.moduleName}.${methodName}:`,
            error
          );
          throw {
            code: "IPC_ERROR",
            message: error instanceof Error ? error.message : String(error),
            method: `${this.channelPrefix}:${methodName}`,
            timestamp: new Date().toISOString(),
          };
        } else {
          // Custom handling - just log and rethrow
          this.logger.error(
            `Error in ${this.moduleName}.${methodName}:`,
            error
          );
          throw error;
        }
      }
    };
  }

  /**
   * Get metadata for all IPC methods in this module
   * @returns Array of method metadata
   */
  getMethodsMetadata(): Array<{
    name: string;
    channel: string;
    metadata: IpcMethodMetadata;
  }> {
    const prototype = Object.getPrototypeOf(this);
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) =>
        name !== "constructor" &&
        typeof prototype[name] === "function" &&
        !name.startsWith("_") &&
        Reflect.getMetadata(IPC_METHOD_METADATA_KEY, prototype, name) !==
          undefined
    );

    return methodNames.map((name) => ({
      name,
      channel: this.channelPrefix ? `${this.channelPrefix}:${name}` : name,
      metadata:
        Reflect.getMetadata(IPC_METHOD_METADATA_KEY, prototype, name) || {},
    }));
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

  /**
   * Get the module name
   */
  getModuleName(): string {
    return this.moduleName;
  }

  /**
   * Get the channel prefix
   */
  getChannelPrefix(): string {
    return this.channelPrefix;
  }
}

/**
 * Decorator to mark a method as an IPC handler with optional metadata
 */
export function IpcMethod(metadata: IpcMethodMetadata = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // Store metadata on the method
    Reflect.defineMetadata(
      IPC_METHOD_METADATA_KEY,
      metadata,
      target,
      propertyKey
    );

    return descriptor;
  };
}
