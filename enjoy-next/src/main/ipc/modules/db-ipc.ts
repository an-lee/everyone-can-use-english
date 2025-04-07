import { BaseIpcModule, IpcMethod } from "@main/ipc/base-ipc-module";
import { ipcMain } from "electron";
import { db } from "@main/storage/db";
import appConfig from "@main/config/app-config";
import PreloadApiGenerator, {
  ServiceHandlerMetadata,
} from "../preload-generator";

// Define the types locally instead of importing from @preload/db-api
export type DbConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type DbState = {
  state: DbConnectionState;
  path: string | null;
  error: string | null;
  autoConnected?: boolean;
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
    (name) => typeof service[name] === "function" && !name.startsWith("_")
  );

  // Generate metadata for preload API generation
  const metadata: ServiceHandlerMetadata = {
    name: entityName,
    channelPrefix,
    methods: [],
  };

  // Create a handler for each method
  for (const methodName of methodNames) {
    if (typeof service[methodName] !== "function") {
      continue;
    }

    // Create the handler function
    handlers[methodName] = async (...args: any[]) => {
      try {
        return await service[methodName](...args);
      } catch (error: any) {
        // Create a standardized error response
        const message = error instanceof Error ? error.message : String(error);
        throw {
          code: error.code || "DB_ERROR",
          message,
          method: `db:${channelPrefix}${capitalize(methodName)}`,
          timestamp: new Date().toISOString(),
        };
      }
    };

    // Add metadata for this method
    // In a real implementation you'd extract parameter types through reflection
    metadata.methods.push({
      name: methodName,
      returnType: "any", // This would be more specific in a real implementation
      description: `${entityName} ${methodName} operation`,
    });
  }

  // Register the metadata for preload API generation
  PreloadApiGenerator.registerServiceHandler(metadata);

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

  constructor() {
    super("Database", "db");
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
      // Unregister entity handlers before disconnecting
      this.unregisterEntityHandlers();

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
      // If connected but datasource is actually not initialized, correct the state
      if (
        db.currentState.state === "connected" &&
        !db.dataSource?.isInitialized
      ) {
        db.broadcastState({
          ...db.currentState,
          state: "disconnected",
          error: "Database connection lost",
        });
      }

      // For new connections, check if path is valid
      if (db.currentState.state === "disconnected") {
        const dbPath = appConfig.dbPath();
        if (!dbPath) {
          return {
            ...db.currentState,
            error: "No database path available, please login first",
          };
        }
      }

      return db.currentState;
    } catch (error) {
      this.logger.error("IPC db:status error:", error);
      return {
        state: "error",
        path: appConfig.dbPath(),
        error: error instanceof Error ? error.message : String(error),
        autoConnected: false,
      };
    }
  }

  /**
   * Register entity handlers for this module
   * These are loaded dynamically when the database is connected
   */
  async registerEntityHandlers(): Promise<void> {
    if (!db.dataSource?.isInitialized) {
      this.logger.warn(
        "Attempted to register entity handlers while database is disconnected"
      );
      return;
    }

    this.logger.info("Loading entity handlers");

    try {
      // Clean up any existing registrations
      this.unregisterEntityHandlers();

      // Register the Audio service first (direct import for simplicity)
      await this.registerAudioService();
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
      const channelName = `db:${channelPrefix}${capitalize(methodName)}`;

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

    // Clear the preload generator service handlers
    PreloadApiGenerator.clearServiceHandlers();

    this.logger.info("Entity handlers unregistered");
  }
}

// Singleton instance
export const dbIpcModule = new DbIpcModule();
