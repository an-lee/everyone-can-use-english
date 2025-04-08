import { BaseIpcModule, IpcMethod } from "@main/ipc/modules";
import { ipcMain } from "electron";
import { db } from "@main/storage/db";
import appConfig from "@/main/core/app/config";
import PreloadApiGenerator, {
  ServiceHandlerMetadata,
} from "@main/ipc/preload/preload-generator";
import {
  audioService,
  createIpcHandlers,
  getServiceMethodMetadata,
} from "@main/storage/services";

// Database connection states
export type DbConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "locked"
  | "reconnecting";

// Database state information
export type DbState = {
  state: DbConnectionState;
  path: string | null;
  error: string | null;
  autoConnected?: boolean;
  retryCount?: number;
  retryDelay?: number;
  lastOperation?: string;
  connectionTime?: number;
  stats?: {
    connectionDuration?: number;
    operationCount?: number;
    lastError?: { message: string; time: number } | null;
  };
};

/**
 * Database IPC module for handling database operations
 */
export class DbIpcModule extends BaseIpcModule {
  private registeredEntityHandlers: Set<string> = new Set();
  private registeredServices: Map<string, any> = new Map();
  private entityHandlersGenerated = false;

  constructor() {
    super("Database", "db");
    this.initializeHandlers();
  }

  /**
   * Initialize entity handlers
   */
  private initializeHandlers(): void {
    // Generate preload API and register handlers
    Promise.all([
      this.generateEntityHandlersForPreload(),
      this.registerEntityHandlers(),
    ]).catch((err) => {
      this.logger.error("Failed to initialize entity handlers:", err);
    });
  }

  /**
   * Register handlers - overridden to ensure entity handlers are generated
   */
  registerHandlers(): void {
    if (!this.entityHandlersGenerated) {
      this.generateEntityHandlersForPreload().catch((err) => {
        this.logger.error("Failed to generate entity handlers:", err);
      });
    }
    super.registerHandlers();
  }

  /**
   * Connect to the database
   */
  @IpcMethod({
    description: "Connect to the database",
    errorHandling: "standard",
    returns: {
      type: "DbState",
      description: "The current database state",
    },
  })
  async connect(): Promise<DbState> {
    try {
      await db.connect({ retry: true });

      if (db.dataSource?.isInitialized) {
        await this.registerEntityHandlers();
      }

      return db.currentState;
    } catch (error) {
      this.logger.error("IPC db:connect error:", error);
      return db.currentState; // Return current state even on error
    }
  }

  /**
   * Disconnect from the database
   */
  @IpcMethod({
    description: "Disconnect from the database",
    errorHandling: "standard",
    returns: {
      type: "{ state: 'disconnected' }",
      description: "Disconnected state object",
    },
  })
  async disconnect(): Promise<DbState> {
    try {
      await db.disconnect();
      return { state: "disconnected" as const, path: null, error: null };
    } catch (error) {
      this.logger.error("IPC db:disconnect error:", error);
      return db.currentState;
    }
  }

  /**
   * Create a backup of the database
   */
  @IpcMethod({
    description: "Create a backup of the database",
    errorHandling: "standard",
    returns: {
      type: "{ state: 'backup-completed' }",
      description: "Backup completion state object",
    },
  })
  async backup(): Promise<{ state: "backup-completed" }> {
    try {
      await db.backup();
      return { state: "backup-completed" };
    } catch (error) {
      this.logger.error("IPC db:backup error:", error);
      throw error;
    }
  }

  /**
   * Get the current database status
   */
  @IpcMethod({
    description: "Get the current database status",
    errorHandling: "standard",
    returns: {
      type: "DbState",
      description: "The current database state",
    },
  })
  async status(): Promise<DbState> {
    try {
      // Track operation metrics
      db.lastOperation = "status";
      db.operationCount = (db.operationCount || 0) + 1;
      const startTime = Date.now();

      // Verify connection state
      this.validateConnectionState();

      // Check path validity for disconnected state
      if (db.currentState.state === "disconnected" && !appConfig.dbPath()) {
        return {
          ...db.currentState,
          error: "No database path available, please login first",
          lastOperation: "status",
        };
      }

      // Build enhanced state with stats
      const enhancedState = this.buildEnhancedState();

      this.logger.debug(
        `Status check completed in ${Date.now() - startTime}ms`
      );
      return enhancedState;
    } catch (error) {
      return this.handleStatusError(error);
    }
  }

  /**
   * Validate the current connection state
   */
  private validateConnectionState(): void {
    if (
      db.currentState.state === "connected" &&
      !db.dataSource?.isInitialized
    ) {
      db.broadcastState({
        ...db.currentState,
        state: "disconnected",
        error: "Database connection lost",
        lastOperation: "status",
      });
    }
  }

  /**
   * Build enhanced state with statistics
   */
  private buildEnhancedState(): DbState {
    const enhancedState = { ...db.currentState, lastOperation: "status" };

    if (db.currentState.state === "connected" && db.connectionStartTime > 0) {
      enhancedState.stats = {
        connectionDuration: Date.now() - db.connectionStartTime,
        operationCount: db.operationCount || 0,
        lastError: db.lastError
          ? { message: db.lastError.message, time: db.lastErrorTime }
          : null,
      };
    }

    return enhancedState;
  }

  /**
   * Handle status error case
   */
  private handleStatusError(error: any): DbState {
    // Record the error
    db.lastError = error instanceof Error ? error : new Error(String(error));
    db.lastErrorTime = Date.now();

    this.logger.error("IPC db:status error:", error);

    return {
      state: "error",
      path: appConfig.dbPath(),
      error: error instanceof Error ? error.message : String(error),
      autoConnected: false,
      lastOperation: "status",
      stats: {
        lastError: {
          message: error instanceof Error ? error.message : String(error),
          time: db.lastErrorTime,
        },
      },
    };
  }

  /**
   * Generate entity handlers metadata for preload API
   */
  async generateEntityHandlersForPreload(): Promise<void> {
    this.logger.info("Generating entity handlers for preload API");

    try {
      // Register services with preload API
      await this.generateServicePreloadApi(
        "Audio",
        audioService,
        "audio",
        "db"
      );
      // Add more services here as needed

      this.entityHandlersGenerated = true;
      this.logger.info("Entity handlers generated for preload API");
    } catch (error) {
      this.logger.error(
        "Failed to generate entity handlers for preload:",
        error
      );
    }
  }

  /**
   * Generate service preload API metadata
   */
  private async generateServicePreloadApi<T extends object>(
    serviceName: string,
    serviceObject: T,
    channelPrefix: string,
    parentModule?: string
  ): Promise<void> {
    try {
      if (!serviceObject) {
        throw new Error(`${serviceName}Service object is not valid`);
      }

      const serviceInstance = this.resolveServiceInstance(serviceObject);
      const methodNames = this.getServiceMethodNames(serviceInstance);

      const metadata = this.buildServiceMetadata(
        serviceName,
        serviceInstance,
        methodNames,
        channelPrefix,
        parentModule
      );

      PreloadApiGenerator.registerServiceHandler(metadata);

      this.logger.debug(
        `Generated ${serviceName} preload API with ${metadata.methods.length} methods`
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate ${serviceName} preload API:`,
        error
      );
    }
  }

  /**
   * Resolve a service instance
   */
  private resolveServiceInstance<T>(serviceObject: T): any {
    return typeof serviceObject === "function"
      ? new (serviceObject as any)()
      : serviceObject;
  }

  /**
   * Get method names from a service instance
   */
  private getServiceMethodNames(serviceInstance: any): string[] {
    return Object.getOwnPropertyNames(
      Object.getPrototypeOf(serviceInstance)
    ).filter(
      (name) =>
        typeof serviceInstance[name] === "function" &&
        !name.startsWith("_") &&
        name !== "constructor"
    );
  }

  /**
   * Build service metadata for preload API
   */
  private buildServiceMetadata(
    serviceName: string,
    serviceInstance: any,
    methodNames: string[],
    channelPrefix: string,
    parentModule?: string
  ): ServiceHandlerMetadata {
    return {
      name: serviceName,
      channelPrefix,
      parentModule,
      methods: methodNames.map((methodName) => ({
        name: methodName,
        returnType: this.inferReturnType(
          methodName,
          serviceName,
          serviceInstance
        ),
        description: `${serviceName} ${methodName} operation`,
        parameters: this.inferParameters(methodName, serviceInstance),
      })),
    };
  }

  /**
   * Register entity handlers for this module
   */
  async registerEntityHandlers(): Promise<void> {
    this.logger.info("Loading entity handlers");

    try {
      if (this.registeredEntityHandlers.size > 0) {
        this.logger.info("Entity handlers already registered");
        return;
      }

      this.registerServiceHandlers("Audio", audioService, "audio");
      // Add more services here as needed
    } catch (error) {
      this.logger.error("Failed to register entity handlers:", error);
    }
  }

  /**
   * Register handlers for a service
   */
  private registerServiceHandlers(
    name: string,
    service: any,
    channelPrefix: string
  ): void {
    this.logger.info(`Registering handlers for ${name} service`);

    const handlers = createIpcHandlers(name, service, channelPrefix);
    let registeredCount = 0;

    for (const [methodName, handler] of Object.entries(handlers)) {
      const channelName = `db:${channelPrefix}:${methodName}`;

      if (this.registeredEntityHandlers.has(channelName)) {
        this.logger.debug(`Handler already registered for ${channelName}`);
        continue;
      }

      ipcMain.handle(channelName, (event, ...args) => handler(...args));
      this.registeredEntityHandlers.add(channelName);
      this.logger.debug(`Registered handler: ${channelName}`);
      registeredCount++;
    }

    this.registeredServices.set(name, service);
    this.logger.info(
      `Registered ${registeredCount} handlers for ${name} service`
    );
  }

  /**
   * Run database migrations
   */
  @IpcMethod({
    description: "Run database migrations",
    errorHandling: "standard",
    returns: {
      type: "object",
      description: "Migration result",
    },
  })
  async migrate(): Promise<{ success: boolean; duration: number }> {
    if (!db.dataSource?.isInitialized) {
      throw new Error(
        "Database not connected. Please connect to database first."
      );
    }

    try {
      return await db.migrate();
    } catch (error) {
      this.logger.error("IPC db:migrate error:", error);
      throw error;
    }
  }

  /**
   * Infer parameters from method metadata
   */
  private inferParameters(
    methodName: string,
    serviceInstance: any
  ): Array<{
    name: string;
    type: string;
    required?: boolean;
  }> {
    const constructor =
      typeof serviceInstance === "function"
        ? serviceInstance
        : serviceInstance.constructor;

    const metadata = getServiceMethodMetadata(constructor, methodName);

    if (metadata?.parameters) {
      return metadata.parameters.map((param) => ({
        name: param.name,
        type: param.type,
        required: param.required,
      }));
    }

    return [];
  }

  /**
   * Infer return type from method metadata
   */
  private inferReturnType(
    methodName: string,
    entityName: string,
    serviceInstance: any
  ): string {
    const constructor =
      typeof serviceInstance === "function"
        ? serviceInstance
        : serviceInstance.constructor;

    const metadata = getServiceMethodMetadata(constructor, methodName);
    return metadata?.returnType || "Promise<any>";
  }
}

// Singleton instance
export const dbIpcModule = new DbIpcModule();
