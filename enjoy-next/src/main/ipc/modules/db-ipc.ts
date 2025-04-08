import { BaseIpcModule, IpcMethod } from "@main/ipc/modules";
import { db } from "@main/storage/db";
import appConfig from "@/main/core/app/config";

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
  constructor() {
    super("Database", "db");
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
}

// Singleton instance
export const dbIpcModule = new DbIpcModule();
