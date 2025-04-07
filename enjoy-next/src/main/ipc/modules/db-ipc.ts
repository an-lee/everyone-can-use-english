import { BaseIpcModule, IpcMethod } from "@main/ipc/modules";
import { ipcMain } from "electron";
import { db } from "@main/storage/db";
import appConfig from "@/main/core/app/config";
import PreloadApiGenerator, {
  ServiceHandlerMetadata,
} from "@main/ipc/preload/preload-generator";
import { log } from "@main/core";
import { AudioService } from "@main/storage/services";

// Define the types locally instead of importing from @preload/db-api
export type DbConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "locked"
  | "reconnecting";

/**
 * Database state type definition
 */
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
    lastError?: {
      message: string;
      time: number;
    } | null;
  };
};

/**
 * Handler factory for creating IPC handlers from service classes
 * This is a more advanced version that also registers metadata for preload generation
 */
export function createIpcHandlers<
  T extends Record<string, (...args: any[]) => Promise<any>>,
>(
  entityName: string,
  service: T,
  channelPrefix: string
): Record<string, (...args: any[]) => Promise<any>> {
  // Create the handlers
  const handlers: Record<string, (...args: any[]) => Promise<any>> = {};

  // Extract method names from the service
  const methodNames = Object.getOwnPropertyNames(service).filter(
    (name) =>
      typeof service[name as keyof typeof service] === "function" &&
      !name.startsWith("_")
  );

  // Generate metadata for preload API generation
  const metadata: ServiceHandlerMetadata = {
    name: entityName,
    channelPrefix: channelPrefix,
    parentModule: "db", // Specify db as the parent module
    methods: [],
  };

  // Create a handler for each method
  for (const methodName of methodNames) {
    if (typeof service[methodName as keyof typeof service] !== "function") {
      continue;
    }

    // Create the handler function
    handlers[methodName] = async (...args: any[]) => {
      try {
        // Check if database is connected before executing the method
        if (!db.dataSource?.isInitialized) {
          const dbState = db.currentState.state;
          throw new Error(
            `Database is not connected (current state: ${dbState}). Please connect to the database first.`
          );
        }

        return await service[methodName as keyof typeof service](...args);
      } catch (error: any) {
        // Create a standardized error response
        const message = error instanceof Error ? error.message : String(error);
        throw {
          code: error.code || "DB_ERROR",
          message,
          method: `db:${channelPrefix}:${methodName}`,
          timestamp: new Date().toISOString(),
        };
      }
    };

    // Add metadata for this method
    metadata.methods.push({
      name: methodName,
      returnType: "any", // This would be more specific in a real implementation
      description: `${entityName} ${methodName} operation`,
    });
  }

  // Register the metadata for preload API generation
  PreloadApiGenerator.registerServiceHandler(metadata);

  // Log registration for debugging
  log
    .scope("ipc-db")
    .info(
      `Registered service handler: ${entityName} with ${metadata.methods.length} methods under db.${channelPrefix}`
    );

  return handlers;
}

/**
 * Helper function to capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Database IPC module for handling database operations
 */
export class DbIpcModule extends BaseIpcModule {
  private registeredEntityHandlers: Set<string> = new Set();
  private registeredServices: Map<string, any> = new Map();
  private entityHandlersGenerated: boolean = false;

  constructor() {
    super("Database", "db");

    // Generate entity handlers for preload API during initialization
    this.generateEntityHandlersForPreload().catch((err) => {
      this.logger.error("Failed to generate entity handlers for preload:", err);
    });

    // Also register entity handlers so they're available even before DB connects
    this.registerEntityHandlers().catch((err) => {
      this.logger.error("Failed to register entity handlers:", err);
    });
  }

  /**
   * Register handlers - overridden to ensure entity handlers are generated
   */
  registerHandlers(): void {
    // If entity handlers haven't been generated yet, do it now
    if (!this.entityHandlersGenerated) {
      this.generateEntityHandlersForPreload().catch((err) => {
        this.logger.error(
          "Failed to generate entity handlers during handler registration:",
          err
        );
      });
    }

    // Call parent method to register normal handlers
    super.registerHandlers();
  }

  /**
   * Connect to the database
   * @returns Current database state
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

      // Register entity handlers after successful connection
      if (db.dataSource?.isInitialized) {
        await this.registerEntityHandlers();
      }

      return db.currentState;
    } catch (error) {
      this.logger.error("IPC db:connect error:", error);
      // Return current state even on error - UI will show the error state
      return db.currentState;
    }
  }

  /**
   * Disconnect from the database
   * @returns Disconnected state
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
      // Don't unregister entity handlers when disconnecting
      // This allows calls to succeed even when database is disconnected
      // They will just return appropriate errors

      await db.disconnect();
      return { state: "disconnected" as const, path: null, error: null };
    } catch (error) {
      this.logger.error("IPC db:disconnect error:", error);
      return db.currentState;
    }
  }

  /**
   * Create a backup of the database
   * @returns Backup completion state
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
   * @returns Current database state
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
      // Track operation for metrics
      db.lastOperation = "status";
      db.operationCount = (db.operationCount || 0) + 1;

      const startTime = Date.now();

      // If connected but datasource is actually not initialized, correct the state
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

      // For new connections, check if path is valid
      if (db.currentState.state === "disconnected") {
        const dbPath = appConfig.dbPath();
        if (!dbPath) {
          return {
            ...db.currentState,
            error: "No database path available, please login first",
            lastOperation: "status",
          };
        }
      }

      // Calculate connection duration for connected databases
      let enhancedState = { ...db.currentState };

      if (db.currentState.state === "connected" && db.connectionStartTime > 0) {
        enhancedState.stats = {
          connectionDuration: Date.now() - db.connectionStartTime,
          operationCount: db.operationCount || 0,
          lastError: db.lastError
            ? {
                message: db.lastError.message,
                time: db.lastErrorTime,
              }
            : null,
        };
      }

      // Add operation timing
      this.logger.debug(
        `Status check completed in ${Date.now() - startTime}ms`
      );
      enhancedState.lastOperation = "status";

      return enhancedState;
    } catch (error) {
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
  }

  /**
   * Generate entity handlers metadata for preload API generation
   * This is called during initialization to ensure all API types are available
   * even before the database is connected
   */
  async generateEntityHandlersForPreload(): Promise<void> {
    this.logger.info("Generating entity handlers for preload API");

    try {
      // Generate preload API definitions for audio service
      await this.generateServicePreloadApi(
        "Audio",
        AudioService,
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
   * Generate service preload API metadata automatically from service methods
   * @param serviceName The display name of the service
   * @param serviceObject The service object with methods
   * @param channelPrefix The channel prefix for IPC calls (e.g., "audio")
   * @param parentModule Optional parent module name (e.g., "db")
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

      // Extract methods
      const methodNames = Object.getOwnPropertyNames(serviceObject).filter(
        (name) =>
          typeof serviceObject[name as keyof typeof serviceObject] ===
            "function" && !name.startsWith("_")
      );

      // Create metadata for API generation
      const metadata: ServiceHandlerMetadata = {
        name: serviceName,
        channelPrefix: channelPrefix,
        parentModule: parentModule,
        methods: methodNames.map((methodName) => {
          // Generate parameter information based on method name conventions
          const paramInfo = this.inferParametersFromMethodName(methodName);

          // Generate return type based on method name conventions
          const returnType = this.inferReturnTypeFromMethodName(
            methodName,
            serviceName
          );

          return {
            name: methodName,
            returnType,
            description: `${serviceName} ${methodName} operation`,
            parameters: paramInfo,
          };
        }),
      };

      // Register the metadata
      PreloadApiGenerator.registerServiceHandler(metadata);

      this.logger.debug(
        `Generated ${serviceName} service preload API with ${metadata.methods.length} methods`
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate ${serviceName} service preload API:`,
        error
      );
    }
  }

  /**
   * Infer parameters based on method name conventions
   */
  private inferParametersFromMethodName(methodName: string): Array<{
    name: string;
    type: string;
    required?: boolean;
  }> {
    // Common parameter patterns based on method name
    if (methodName === "findAll") {
      return [
        {
          name: "options",
          type: "{ page?: number; limit?: number; search?: string }",
          required: false,
        },
      ];
    } else if (methodName === "findById") {
      return [
        {
          name: "id",
          type: "string",
          required: true,
        },
      ];
    } else if (methodName === "findByMd5" || methodName.startsWith("findBy")) {
      // Extract the field name from methods like findByXxx
      const fieldName = methodName.replace("findBy", "");
      const paramName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);

      return [
        {
          name: paramName,
          type: "string",
          required: true,
        },
      ];
    } else if (methodName === "create") {
      return [
        {
          name: "data",
          type: "any",
          required: true,
        },
      ];
    } else if (methodName === "update") {
      return [
        {
          name: "id",
          type: "string",
          required: true,
        },
        {
          name: "data",
          type: "any",
          required: true,
        },
      ];
    } else if (methodName === "delete" || methodName === "remove") {
      return [
        {
          name: "id",
          type: "string",
          required: true,
        },
      ];
    }

    // Default to empty array for unknown methods
    return [];
  }

  /**
   * Infer return type based on method name conventions
   */
  private inferReturnTypeFromMethodName(
    methodName: string,
    entityName: string
  ): string {
    if (methodName === "findAll") {
      return `Promise<{ items: any[]; total: number; page: number; limit: number; totalPages: number; }>`;
    } else if (methodName.startsWith("findBy") || methodName === "findById") {
      return `Promise<any>`; // Could be improved to return the entity type
    } else if (methodName === "create" || methodName === "update") {
      return `Promise<any>`; // Could be improved to return the entity type
    } else if (methodName === "delete" || methodName === "remove") {
      return "Promise<boolean>";
    }

    // Default return type
    return "Promise<any>";
  }

  /**
   * Register entity handlers for this module
   * These are loaded dynamically when the database is connected
   */
  async registerEntityHandlers(): Promise<void> {
    this.logger.info("Loading entity handlers");

    try {
      // Only register if not already registered
      if (this.registeredEntityHandlers.size > 0) {
        this.logger.info(
          "Entity handlers already registered, skipping registration"
        );
        return;
      }

      // Register the Audio service first (direct import for simplicity)
      await this.registerAudioService();

      // Add more services here as needed
    } catch (error) {
      this.logger.error("Failed to register entity handlers:", error);
    }
  }

  /**
   * Register the Audio service directly
   */
  private async registerAudioService(): Promise<void> {
    try {
      // Import the AudioService
      const { AudioService } = await import(
        "@main/storage/services/audio-service"
      );

      // Register it
      this.registerServiceHandlers("Audio", AudioService, "audio");
      this.logger.info(
        "Audio service registered successfully with db:audio:* handlers"
      );
    } catch (error) {
      this.logger.error("Failed to register Audio service:", error);
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

    // Create the handlers using our factory
    const handlers = createIpcHandlers(name, service, channelPrefix);

    // Register each handler with IPC
    for (const [methodName, handler] of Object.entries(handlers)) {
      // Use the hierarchical db:entity:method format (db:audio:findAll)
      const channelName = `db:${channelPrefix}:${methodName}`;

      // Check if this handler is already registered
      if (this.registeredEntityHandlers.has(channelName)) {
        this.logger.debug(
          `Handler already registered for ${channelName}, skipping`
        );
        continue;
      }

      ipcMain.handle(channelName, (event, ...args) => handler(...args));
      this.registeredEntityHandlers.add(channelName);
      this.logger.debug(`Registered entity handler: ${channelName}`);
    }

    // Keep track of the service
    this.registeredServices.set(name, service);

    this.logger.info(
      `Registered ${Object.keys(handlers).length} handlers for ${name} service`
    );
  }

  /**
   * Unregister entity handlers
   */
  unregisterEntityHandlers(): void {
    // Unregister all IPC handlers
    for (const channelName of this.registeredEntityHandlers) {
      ipcMain.removeHandler(channelName);
      this.logger.debug(`Unregistered entity handler: ${channelName}`);
    }

    // Clear the collections
    this.registeredEntityHandlers.clear();
    this.registeredServices.clear();

    // Don't clear preload API definitions as they're needed for type generation
    // PreloadApiGenerator.clearServiceHandlers();

    this.logger.info("Entity handlers unregistered");
  }

  /**
   * Run database migrations
   * @returns Migration result
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
}

// Singleton instance
export const dbIpcModule = new DbIpcModule();
