import { BrowserWindow } from "electron";
import { DataSource } from "typeorm";
import path from "path";
import fs from "fs-extra";
import { log } from "@main/core/utils";
import appConfig from "@main/core/app/config";
import { AppDataSource } from "@main/storage/data-source";
import { IpcChannels } from "@shared/ipc/ipc-channels";

const logger = log.scope("DatabaseManager");

// Retry configuration
const RETRY_DELAYS = [1000, 2000, 3000, 5000, 8000]; // Fibonacci-like sequence
const MAX_RETRIES = RETRY_DELAYS.length;
const CONNECTION_TIMEOUT = 10000; // 10 seconds timeout for connection

class DatabaseManager {
  private dataSource: DataSource | null = null;
  private isConnecting = false;
  private autoConnected = false;
  private retryCount = 0;
  private retryTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private connectionStartTime = 0;
  private operationCount = 0;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastError: Error | null = null;
  private lastErrorTime = 0;
  private sessionId = "";
  private currentState: DbState = {
    state: "disconnected",
    path: null,
    error: null,
    autoConnected: false,
  };

  private broadcastState(state: DbState) {
    const currentState = this.currentState;

    const isStateChange = currentState.state !== state.state;
    const isErrorChange = currentState.error !== state.error;
    const isPathChange = currentState.path !== state.path;

    if (!isStateChange && !isErrorChange && !isPathChange) {
      return;
    }

    this.currentState = state;

    logger.debug(
      `Broadcasting state change: ${currentState.state} → ${state.state}`
    );
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send(IpcChannels.DB.STATE_CHANGED, state);
      }
    });
  }

  public async connect(options?: { retry?: boolean }) {
    const shouldRetry = options?.retry !== false;

    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    if (this.isConnecting) {
      throw new Error("Database connection is already in progress");
    }

    this.isConnecting = true;
    this.broadcastState({
      ...this.currentState,
      state: "connecting",
    });

    try {
      if (this.dataSource?.isInitialized) {
        logger.info("Database already connected");
        this.broadcastState({
          state: "connected",
          path: appConfig.dbPath(),
          error: null,
          autoConnected: this.autoConnected,
        });
        this.isConnecting = false;
        return;
      }

      const currentUser = appConfig.currentUser();
      if (!currentUser) {
        throw new Error(
          "No user logged in. Please log in before connecting to the database."
        );
      }

      if (!currentUser.id) {
        throw new Error("User ID is required for database connection.");
      }

      const dbPath = appConfig.dbPath();
      if (!dbPath) {
        throw new Error(
          "Database path is not ready. Make sure user is set in config."
        );
      }

      fs.ensureDirSync(path.dirname(dbPath));

      // Only set the database path, keep the migrations configuration from data-source.ts
      AppDataSource.setOptions({
        database: dbPath,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              "Database connection timed out after " + CONNECTION_TIMEOUT + "ms"
            )
          );
        }, CONNECTION_TIMEOUT);
      });

      if (this.dataSource === null) {
        logger.info("Initializing new AppDataSource");
        await Promise.race([AppDataSource.initialize(), timeoutPromise]);

        logger.info("New database, running migrations");
        const availableMigrations = AppDataSource.migrations;
        logger.info(
          "Available migrations:",
          availableMigrations.length,
          availableMigrations.map((m) => m.name)
        );

        try {
          await AppDataSource.runMigrations();
          logger.info("Migrations completed successfully");

          // Verify table creation
          const tablesCreated = await AppDataSource.query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='audio'"
          );
          if (tablesCreated.length === 0) {
            logger.warn("Migrations ran but expected tables were not created");
          }
        } catch (migrationError: unknown) {
          logger.error(
            migrationError instanceof Error
              ? migrationError.message
              : String(migrationError)
          );
          await AppDataSource.destroy();
          throw migrationError;
        }

        this.dataSource = AppDataSource;
      } else {
        logger.info("Reinitializing existing AppDataSource");
        await Promise.race([this.dataSource.initialize(), timeoutPromise]);
      }

      this.retryCount = 0;
      this.connectionStartTime = Date.now();
      this.operationCount = 0;
      this.sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      logger.info(
        `Database connection established (Session: ${this.sessionId})`
      );

      if (this.pingInterval) {
        clearInterval(this.pingInterval);
      }

      this.pingInterval = setInterval(() => {
        if (this.dataSource?.isInitialized) {
          this.dataSource
            .query("SELECT 1")
            .then(() => {
              logger.debug(
                `Database ping successful (Session: ${this.sessionId})`
              );
            })
            .catch((err) => {
              logger.warn(
                `Database ping failed (Session: ${this.sessionId}):`,
                err
              );
              this.broadcastState({
                ...this.currentState,
                state: "reconnecting",
                error: `Connection check failed: ${err.message}`,
                lastOperation: "ping",
              });
            });
        } else {
          if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
          }
        }
      }, 300000);

      this.broadcastState({
        state: "connected",
        path: dbPath,
        error: null,
        autoConnected: this.autoConnected,
        connectionTime: this.connectionStartTime,
        stats: {
          connectionDuration: 0,
          operationCount: 0,
          lastError: this.lastError
            ? {
                message: this.lastError.message,
                time: this.lastErrorTime,
              }
            : null,
        },
      });
    } catch (err) {
      logger.error(
        `Database connection error (Session: ${this.sessionId}):`,
        err
      );

      this.lastError = err instanceof Error ? err : new Error(String(err));
      this.lastErrorTime = Date.now();

      const errorMessage = String(err);
      if (errorMessage.includes("database is locked")) {
        logger.warn("Database lock detected, will try reconnection");
        this.broadcastState({
          state: "locked",
          path: appConfig.dbPath(),
          error: `Database is locked: ${errorMessage}`,
          autoConnected: this.autoConnected,
          retryCount: this.retryCount,
          retryDelay:
            this.retryCount < MAX_RETRIES ? RETRY_DELAYS[this.retryCount] : 0,
          lastOperation: "connect",
          stats: {
            connectionDuration: 0,
            operationCount: 0,
            lastError: {
              message: errorMessage,
              time: this.lastErrorTime,
            },
          },
        });

        if (shouldRetry && this.autoConnected) {
          setTimeout(() => this.reconnect(), 3000);
        }

        throw err;
      }

      if (shouldRetry && this.autoConnected && this.retryCount < MAX_RETRIES) {
        const retryDelay = RETRY_DELAYS[this.retryCount];
        this.retryCount++;

        logger.info(
          `Retrying database connection in ${retryDelay}ms (attempt ${this.retryCount}, Session: ${this.sessionId})`
        );

        this.broadcastState({
          state: "error",
          path: appConfig.dbPath(),
          error: `Connection failed: ${err instanceof Error ? err.message : String(err)}. Retrying in ${retryDelay / 1000}s...`,
          autoConnected: this.autoConnected,
          retryCount: this.retryCount,
          retryDelay: retryDelay,
          lastOperation: "connect",
          stats: {
            connectionDuration: 0,
            operationCount: 0,
            lastError: {
              message: err instanceof Error ? err.message : String(err),
              time: this.lastErrorTime,
            },
          },
        });

        this.retryTimer = setTimeout(() => {
          this.connect({ retry: true });
        }, retryDelay);
      } else {
        this.broadcastState({
          state: "error",
          path: appConfig.dbPath(),
          error: err instanceof Error ? err.message : String(err),
          autoConnected: this.autoConnected,
          lastOperation: "connect",
          stats: {
            connectionDuration: 0,
            operationCount: 0,
            lastError: {
              message: err instanceof Error ? err.message : String(err),
              time: this.lastErrorTime,
            },
          },
        });
      }

      throw err;
    } finally {
      this.isConnecting = false;
    }
  }

  public async disconnect() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    try {
      if (this.dataSource?.isInitialized) {
        try {
          const disconnectStart = Date.now();
          await this.dataSource.destroy();
          logger.debug(
            `Database disconnection completed in ${Date.now() - disconnectStart}ms`
          );
        } catch (err) {
          if (
            err instanceof Error &&
            err.message.includes("Database handle is closed")
          ) {
            logger.warn("Database was already closed:", err.message);
          } else {
            throw err;
          }
        }

        this.dataSource = null;
        this.retryCount = 0;
        this.connectionStartTime = 0;
        this.operationCount = 0;

        logger.info(`Database connection closed (Session: ${this.sessionId})`);

        this.broadcastState({
          state: "disconnected",
          path: null,
          error: null,
          autoConnected: false,
          lastOperation: "disconnect",
          stats: {
            connectionDuration: 0,
            operationCount: 0,
            lastError: this.lastError
              ? {
                  message: this.lastError.message,
                  time: this.lastErrorTime,
                }
              : null,
          },
        });

        this.sessionId = "";
      } else {
        logger.info("No active database connection to close");
        this.broadcastState({
          state: "disconnected",
          path: null,
          error: null,
          autoConnected: false,
          lastOperation: "disconnect",
        });
      }
    } catch (err) {
      this.lastError = err instanceof Error ? err : new Error(String(err));
      this.lastErrorTime = Date.now();

      logger.error(
        `Database disconnection error (Session: ${this.sessionId}):`,
        err
      );
      this.broadcastState({
        state: "error",
        path: appConfig.dbPath(),
        error: err instanceof Error ? err.message : String(err),
        autoConnected: this.autoConnected,
        lastOperation: "disconnect",
        stats: {
          connectionDuration: 0,
          operationCount: 0,
          lastError: {
            message: err instanceof Error ? err.message : String(err),
            time: this.lastErrorTime,
          },
        },
      });
      throw err;
    }
  }

  public init() {
    if (this.isInitialized) {
      logger.warn("Database already initialized, skipping");
      return;
    }

    logger.info("Initializing database module");

    this.sessionId = `init-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    logger.debug(
      `Database module initialized with session ID: ${this.sessionId}`
    );

    logger.info("Database IPC handlers are managed by the IPC registry");

    let lastUserId: number | null = null;

    appConfig.getUser$().subscribe(async (user) => {
      const userId = user?.id ? Number(user.id) : null;

      if (userId !== lastUserId) {
        logger.debug(`User ID changed: ${lastUserId} -> ${userId}`);
        lastUserId = userId;

        if (userId) {
          logger.info(`User ${userId} logged in, connecting to database`);
          try {
            this.autoConnected = true;
            await this.connect({ retry: true });
          } catch (error) {
            logger.error("Failed to connect to database after login", error);
          }
        } else {
          logger.info("User logged out, disconnecting from database");
          try {
            this.autoConnected = false;
            this.cancelRetry();
            await this.disconnect();
          } catch (error) {
            logger.error(
              "Failed to disconnect from database after logout",
              error
            );
            this.broadcastState({
              state: "error",
              path: appConfig.dbPath(),
              error: error instanceof Error ? error.message : String(error),
              autoConnected: false,
            });
          }
        }
      }
    });

    this.isInitialized = true;
    logger.info("Database module initialized");
  }

  public cancelRetry() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.retryCount = 0;
  }

  public async backup(options?: { force: boolean }) {
    const force = options?.force ?? false;

    const dbPath = appConfig.dbPath();
    if (!dbPath) {
      logger.error("Db path is not ready");
      return;
    }

    const backupPath = path.join(appConfig.libraryPath(), "backup");
    fs.ensureDirSync(backupPath);

    const backupFiles = fs
      .readdirSync(backupPath)
      .filter((file) => file.startsWith(path.basename(dbPath)))
      .sort();

    const lastBackup = backupFiles.pop();
    const timestamp = lastBackup?.match(/\d{13}/)?.[0];
    if (
      !force &&
      lastBackup &&
      timestamp &&
      new Date(parseInt(timestamp)) > new Date(Date.now() - 1000 * 60 * 60 * 24)
    ) {
      logger.info(`Backup is up to date: ${lastBackup}`);
      return;
    }

    if (backupFiles.length >= 10) {
      fs.removeSync(path.join(backupPath, backupFiles[0]));
    }

    const backupFilePath = path.join(
      backupPath,
      `${path.basename(dbPath)}.${Date.now().toString().padStart(13, "0")}`
    );
    fs.copySync(dbPath, backupFilePath);

    logger.info(`Backup created at ${backupFilePath}`);
  }

  public async reconnect() {
    logger.info(
      `Attempting database reconnection (Session: ${this.sessionId})`
    );

    this.broadcastState({
      ...this.currentState,
      state: "reconnecting",
      lastOperation: "reconnect",
    });

    if (this.dataSource?.isInitialized) {
      try {
        await this.disconnect();
      } catch (error) {
        logger.warn("Error during reconnection disconnect:", error);
      }
    }

    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    try {
      await this.connect({ retry: true });
      logger.info(
        `Database reconnection successful (Session: ${this.sessionId})`
      );
    } catch (error) {
      logger.error(
        `Database reconnection failed (Session: ${this.sessionId}):`,
        error
      );
    }
  }

  public async migrate() {
    if (!this.dataSource?.isInitialized) {
      throw new Error(
        "Database not connected. Connect to database before running migrations."
      );
    }

    logger.info(`Running database migrations (Session: ${this.sessionId})`);
    this.broadcastState({
      ...this.currentState,
      lastOperation: "migrate",
    });

    try {
      const startTime = Date.now();

      await this.dataSource.runMigrations();

      const duration = Date.now() - startTime;
      logger.info(
        `Database migrations completed in ${duration}ms (Session: ${this.sessionId})`
      );

      this.broadcastState({
        ...this.currentState,
        lastOperation: "migrate",
      });

      return { success: true, duration };
    } catch (error) {
      this.lastError =
        error instanceof Error ? error : new Error(String(error));
      this.lastErrorTime = Date.now();

      logger.error(
        `Database migration error (Session: ${this.sessionId}):`,
        error
      );

      this.broadcastState({
        ...this.currentState,
        state: "error",
        error: error instanceof Error ? error.message : String(error),
        lastOperation: "migrate",
        stats: {
          connectionDuration: 0,
          operationCount: 0,
          lastError: {
            message: error instanceof Error ? error.message : String(error),
            time: this.lastErrorTime,
          },
        },
      });

      throw error;
    }
  }
}

// Create and export a singleton instance
export const db = new DatabaseManager();
export default db;
