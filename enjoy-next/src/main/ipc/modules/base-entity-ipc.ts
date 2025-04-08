import { BaseIpcModule } from "@main/ipc/modules";
import { ipcMain } from "electron";
import { db } from "@main/storage/db";
import { log } from "@main/core";
import { PreloadApiGenerator, ServiceHandlerMetadata } from "@main/ipc/preload";

/**
 * Base class for entity-specific IPC modules
 * This provides common functionality for all entity service IPC modules
 */
export abstract class BaseEntityIpcModule<
  T extends object,
> extends BaseIpcModule {
  protected service: T;
  protected registeredHandlers: Set<string> = new Set();
  protected logger = log.scope("entity-ipc");
  protected entityName: string;
  protected servicePrefix: string;

  /**
   * Create a new entity IPC module
   * @param name The name of the entity service
   * @param channelPrefix The channel prefix for IPC methods
   * @param service The service instance
   */
  constructor(name: string, channelPrefix: string, service: T) {
    super(`${name}Entity`, channelPrefix);
    this.service = service;
    this.entityName = name;
    this.servicePrefix = channelPrefix;
  }

  /**
   * Initialize the module and register handlers
   */
  public initialize(): void {
    this.registerEntityHandlers();
    this.generatePreloadApi();
  }

  /**
   * Register IPC handlers for all methods in the service
   */
  protected registerEntityHandlers(): void {
    this.logger.info(`Registering handlers for ${this.entityName}Entity`);

    // Get all methods from the service (both directly defined and from prototype)
    const methodNames = this.getServiceMethodNames();

    let registeredCount = 0;
    for (const methodName of methodNames) {
      const channelName = `db:${this.servicePrefix}:${methodName}`;

      if (this.registeredHandlers.has(channelName)) {
        this.logger.debug(`Handler already registered for ${channelName}`);
        continue;
      }

      // Create handler function that checks DB connection before calling service method
      const handler = async (...args: any[]) => {
        try {
          // Check if database is connected
          if (!db.dataSource?.isInitialized) {
            const dbState = db.currentState.state;
            throw new Error(
              `Database is not connected (current state: ${dbState}). Please connect to the database first.`
            );
          }

          return await (this.service as any)[methodName](...args);
        } catch (error: any) {
          // Standardized error response
          const message =
            error instanceof Error ? error.message : String(error);
          throw {
            code: error.code || "DB_ERROR",
            message,
            method: channelName,
            timestamp: new Date().toISOString(),
          };
        }
      };

      // Register the handler
      ipcMain.handle(channelName, (event, ...args) => handler(...args));
      this.registeredHandlers.add(channelName);
      this.logger.debug(`Registered handler: ${channelName}`);
      registeredCount++;
    }

    this.logger.info(
      `Registered ${registeredCount} handlers for ${this.entityName}Entity`
    );
  }

  /**
   * Generate preload API metadata for this entity service
   */
  protected generatePreloadApi(): void {
    try {
      const metadata = this.buildServiceMetadata();
      PreloadApiGenerator.registerServiceHandler(metadata);
      this.logger.info(
        `Generated preload API for ${this.entityName}Entity with ${metadata.methods.length} methods`
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate preload API for ${this.entityName}Entity:`,
        error
      );
    }
  }

  /**
   * Build service metadata for preload API generation
   */
  protected buildServiceMetadata(): ServiceHandlerMetadata {
    const methodNames = this.getServiceMethodNames();

    return {
      name: this.entityName,
      channelPrefix: this.servicePrefix,
      parentModule: "db",
      methods: methodNames.map((methodName) => {
        // Extract method metadata using reflection (implementation will depend on your metadata system)
        const paramMetadata = this.getMethodParameterMetadata(methodName);
        const returnType = this.getMethodReturnType(methodName);

        return {
          name: methodName,
          returnType: returnType || "Promise<any>",
          description: `${this.entityName}Entity ${methodName} operation`,
          parameters: paramMetadata || [],
        };
      }),
    };
  }

  /**
   * Get all method names from the service
   */
  protected getServiceMethodNames(): string[] {
    // Get methods directly defined on the object
    const directMethods = Object.getOwnPropertyNames(this.service).filter(
      (name) =>
        typeof (this.service as any)[name] === "function" &&
        !name.startsWith("_")
    );

    // Get methods from the prototype
    const protoMethods = Object.getOwnPropertyNames(
      Object.getPrototypeOf(this.service)
    ).filter(
      (name) =>
        typeof (this.service as any)[name] === "function" &&
        !name.startsWith("_") &&
        name !== "constructor"
    );

    // Combine and deduplicate
    return [...new Set([...directMethods, ...protoMethods])];
  }

  /**
   * Get parameter metadata for a method
   * Each entity module will need to implement this based on their metadata system
   */
  protected abstract getMethodParameterMetadata(methodName: string): Array<{
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }>;

  /**
   * Get return type for a method
   * Each entity module will need to implement this based on their metadata system
   */
  protected abstract getMethodReturnType(methodName: string): string;

  /**
   * Clean up handlers when module is destroyed
   */
  public dispose(): void {
    for (const channel of this.registeredHandlers) {
      ipcMain.removeHandler(channel);
    }
    this.registeredHandlers.clear();
    this.logger.info(`Disposed handlers for ${this.entityName}Entity`);
  }
}
