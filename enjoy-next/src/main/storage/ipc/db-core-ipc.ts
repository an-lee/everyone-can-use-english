import { BaseIpcModule, IpcMethod } from "@main/core/ipc/base-ipc-module";
import { ipcMain } from "electron";
import { db } from "@main/storage/db";
import appConfig from "@main/config/app-config";
import { AudioIpcHandlers } from "@main/storage/ipc/audio-ipc";

// Registry of entity handlers
const entityHandlers = {
  audio: AudioIpcHandlers,
  // Add more entities here as needed
};

/**
 * Database IPC module for handling database operations
 */
export class DbIpcModule extends BaseIpcModule {
  private registeredEntityHandlers: Set<string> = new Set();

  constructor() {
    super("Database", "db");
  }

  /**
   * Connect to the database
   * @returns Current database state
   */
  @IpcMethod()
  async connect(): Promise<any> {
    try {
      await db.connect({ retry: true });
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
  @IpcMethod()
  async disconnect(): Promise<any> {
    try {
      await db.disconnect();
      return { state: "disconnected" };
    } catch (error) {
      this.logger.error("IPC db:disconnect error:", error);
      return db.currentState;
    }
  }

  /**
   * Create a backup of the database
   * @returns Backup completion state
   */
  @IpcMethod()
  async backup(): Promise<any> {
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
  @IpcMethod()
  async status(): Promise<any> {
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
   * Register all handlers for this module
   * Overriding the BaseIpcModule method to add dynamic entity handlers
   */
  registerHandlers(): void {
    // First register the core DB handlers using the parent class method
    super.registerHandlers();

    // Then register entity handlers
    this.registerEntityHandlers();

    this.logger.info("All database IPC handlers registered");
  }

  /**
   * Unregister all handlers for this module
   * Overriding the BaseIpcModule method to handle dynamic entity handlers
   */
  unregisterHandlers(): void {
    // Unregister entity handlers first
    this.unregisterEntityHandlers();

    // Then unregister the core DB handlers using the parent class method
    super.unregisterHandlers();

    this.logger.info("All database IPC handlers unregistered");
  }

  /**
   * Dynamically register all entity handlers
   */
  registerEntityHandlers(): void {
    if (!db.dataSource?.isInitialized) {
      this.logger.warn(
        "Attempted to register entity handlers while database is disconnected"
      );
      return;
    }

    for (const [entityType, handlers] of Object.entries(entityHandlers)) {
      for (const [methodName, handler] of Object.entries(handlers)) {
        const channelName = `db:${entityType}${this.capitalize(methodName)}`;

        // Create a wrapper that checks DB connection before invoking the handler
        const wrappedHandler = async (
          _event: Electron.IpcMainInvokeEvent,
          ...args: any[]
        ) => {
          this.checkDatabaseConnection();
          // Use Function.prototype.call instead of apply to avoid this-context issues
          return await (handler as Function).call(undefined, ...args);
        };

        ipcMain.handle(channelName, wrappedHandler);
        this.registeredEntityHandlers.add(channelName);
        this.logger.debug(`Registered entity handler: ${channelName}`);
      }
    }

    this.logger.info("Entity handlers registered");
  }

  /**
   * Unregister all entity handlers
   */
  unregisterEntityHandlers(): void {
    for (const channelName of this.registeredEntityHandlers) {
      ipcMain.removeHandler(channelName);
      this.logger.debug(`Unregistered entity handler: ${channelName}`);
    }

    this.registeredEntityHandlers.clear();
    this.logger.info("Entity handlers unregistered");
  }

  /**
   * Helper method to capitalize first letter of a string
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Check if database is connected before accessing entities
   * @throws Error if database is not connected
   */
  private checkDatabaseConnection() {
    if (
      !db.dataSource ||
      !db.dataSource.isInitialized ||
      db.currentState.state !== "connected"
    ) {
      const error = new Error("Database is not connected");
      this.logger.error("Database access attempted while disconnected", error);
      throw error;
    }
  }
}

// Singleton instance
const dbIpcModule = new DbIpcModule();

export default dbIpcModule;
