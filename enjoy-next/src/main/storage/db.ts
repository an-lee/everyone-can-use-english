import { BrowserWindow } from "electron";
import { DataSource } from "typeorm";
import path from "path";
import fs from "fs-extra";
import log from "@main/services/logger";
import appConfig from "@main/config/app-config";
import { AppDataSource } from "@main/storage/data-source";
import { IpcChannels } from "@shared/ipc/ipc-channels";

const logger = log.scope("Storage");

// Retry configuration
const RETRY_DELAYS = [1000, 2000, 3000, 5000, 8000]; // Fibonacci-like sequence
const MAX_RETRIES = RETRY_DELAYS.length;
const CONNECTION_TIMEOUT = 10000; // 10 seconds timeout for connection

// Database state type
export type DbState = {
  state: "disconnected" | "connecting" | "connected" | "error";
  path: string | null;
  error: string | null;
  autoConnected: boolean;
  retryCount?: number;
  retryDelay?: number;
};

// Database module
export const db = {
  dataSource: null as DataSource | null,
  isConnecting: false,
  autoConnected: false,
  retryCount: 0,
  retryTimer: null as NodeJS.Timeout | null,
  ipcHandlersRegistered: false,
  currentState: {
    state: "disconnected",
    path: null,
    error: null,
    autoConnected: false,
  } as DbState,

  // Broadcast database state to all windows
  broadcastState: (state: DbState) => {
    // Update current state
    db.currentState = state;

    // Broadcast to all windows
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send(IpcChannels.DB.STATE_CHANGED, state);
      }
    });
  },

  // Connect to the database with retry logic
  connect: async (options?: { retry?: boolean }) => {
    const shouldRetry = options?.retry !== false;

    // Clear any existing retry timer
    if (db.retryTimer) {
      clearTimeout(db.retryTimer);
      db.retryTimer = null;
    }

    // Use a lock to prevent concurrent connections
    if (db.isConnecting) {
      throw new Error("Database connection is already in progress");
    }

    db.isConnecting = true;
    db.broadcastState({
      ...db.currentState,
      state: "connecting",
    });

    try {
      // Check if we already have a connection
      if (db.dataSource?.isInitialized) {
        logger.info("Database already connected");
        db.broadcastState({
          state: "connected",
          path: appConfig.dbPath(),
          error: null,
          autoConnected: db.autoConnected,
        });
        db.isConnecting = false;
        return;
      }

      const dbPath = appConfig.dbPath();
      if (!dbPath) {
        throw new Error(
          "Database path is not ready. Make sure user is set in config."
        );
      }

      // Ensure the directory exists
      fs.ensureDirSync(path.dirname(dbPath));

      // Make sure we have the latest path in the datasource
      AppDataSource.setOptions({
        database: dbPath,
      });

      // Add connection timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              "Database connection timed out after " + CONNECTION_TIMEOUT + "ms"
            )
          );
        }, CONNECTION_TIMEOUT);
      });

      // Initialize the data source with timeout
      if (db.dataSource === null) {
        logger.info("Initializing new AppDataSource");
        await Promise.race([AppDataSource.initialize(), timeoutPromise]);
        db.dataSource = AppDataSource;
      } else {
        // Reinitialize if previously destroyed
        logger.info("Reinitializing existing AppDataSource");
        await Promise.race([db.dataSource.initialize(), timeoutPromise]);
      }

      // Reset retry count on successful connection
      db.retryCount = 0;

      logger.info("Database connection established");
      db.broadcastState({
        state: "connected",
        path: dbPath,
        error: null,
        autoConnected: db.autoConnected,
      });
    } catch (err) {
      logger.error("Database connection error:", err);

      // Implement retry mechanism with exponential backoff
      if (shouldRetry && db.autoConnected && db.retryCount < MAX_RETRIES) {
        const retryDelay = RETRY_DELAYS[db.retryCount];
        db.retryCount++;

        logger.info(
          `Retrying database connection in ${retryDelay}ms (attempt ${db.retryCount})`
        );

        db.broadcastState({
          state: "error",
          path: appConfig.dbPath(),
          error: `Connection failed: ${err instanceof Error ? err.message : String(err)}. Retrying in ${retryDelay / 1000}s...`,
          autoConnected: db.autoConnected,
          retryCount: db.retryCount,
          retryDelay: retryDelay,
        });

        // Schedule retry
        db.retryTimer = setTimeout(() => {
          db.connect({ retry: true });
        }, retryDelay);
      } else {
        // No more retries or auto-connect is disabled
        db.broadcastState({
          state: "error",
          path: appConfig.dbPath(),
          error: err instanceof Error ? err.message : String(err),
          autoConnected: db.autoConnected,
        });
      }

      throw err;
    } finally {
      db.isConnecting = false;
    }
  },

  // Disconnect from the database
  disconnect: async () => {
    // Clear any retry timer
    if (db.retryTimer) {
      clearTimeout(db.retryTimer);
      db.retryTimer = null;
    }

    try {
      if (db.dataSource?.isInitialized) {
        await db.dataSource.destroy();
        db.dataSource = null;

        // Reset retry count
        db.retryCount = 0;

        logger.info("Database connection closed");
        db.broadcastState({
          state: "disconnected",
          path: null,
          error: null,
          autoConnected: false,
        });
      } else {
        // Make sure we also broadcast state even if datasource wasn't initialized
        logger.info("No active database connection to close");
        db.broadcastState({
          state: "disconnected",
          path: null,
          error: null,
          autoConnected: false,
        });
      }
    } catch (err) {
      logger.error("Database disconnection error:", err);
      db.broadcastState({
        state: "error",
        path: appConfig.dbPath(),
        error: err instanceof Error ? err.message : String(err),
        autoConnected: db.autoConnected,
      });
      throw err;
    }
  },

  // Initialize the database module
  init: () => {
    logger.info("Initializing database module");

    // We don't need to explicitly register IPC handlers here anymore
    // They are automatically discovered and registered by the IPC registry
    // through the files in src/main/core/ipc/modules/
    logger.info("Database IPC handlers are managed by the IPC registry");

    // Set up event listeners for login/logout
    appConfig.getUser$().subscribe(async (user) => {
      if (user) {
        // User logged in
        logger.info(`User ${user.id} logged in, connecting to database`);
        try {
          db.autoConnected = true;
          await db.connect({ retry: true });
        } catch (error) {
          logger.error("Failed to connect to database after login", error);
        }
      } else {
        // User logged out
        logger.info("User logged out, disconnecting from database");
        try {
          db.autoConnected = false;
          db.cancelRetry();
          await db.disconnect();
          db.broadcastState({
            state: "disconnected",
            path: null,
            error: null,
            autoConnected: false,
          });
        } catch (error) {
          logger.error(
            "Failed to disconnect from database after logout",
            error
          );
          db.broadcastState({
            state: "error",
            path: appConfig.dbPath(),
            error: error instanceof Error ? error.message : String(error),
            autoConnected: false,
          });
        }
      }
    });

    logger.info("Database module initialized");
  },

  // Cancel any pending retry
  cancelRetry: () => {
    if (db.retryTimer) {
      clearTimeout(db.retryTimer);
      db.retryTimer = null;
    }
    db.retryCount = 0;
  },

  // Backup the database
  backup: async (options?: { force: boolean }) => {
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

    // Check if the last backup is older than 1 day
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

    // Only keep the latest 10 backups
    if (backupFiles.length >= 10) {
      fs.removeSync(path.join(backupPath, backupFiles[0]));
    }

    const backupFilePath = path.join(
      backupPath,
      `${path.basename(dbPath)}.${Date.now().toString().padStart(13, "0")}`
    );
    fs.copySync(dbPath, backupFilePath);

    logger.info(`Backup created at ${backupFilePath}`);
  },
};

export default db;
