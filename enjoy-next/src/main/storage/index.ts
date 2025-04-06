import { ipcMain, BrowserWindow } from "electron";
import { DataSource } from "typeorm";
import path from "path";
import fs from "fs-extra";
import log from "@main/services/logger";
import appConfig from "@main/config/app-config";
import { AppDataSource } from "./data-source";
import {
  registerAudioHandlers,
  unregisterAudioHandlers,
} from "./handlers/audio-handler";

const logger = log.scope("Storage");

// Retry configuration
const RETRY_DELAYS = [1000, 2000, 3000, 5000, 8000]; // Fibonacci-like sequence
const MAX_RETRIES = RETRY_DELAYS.length;

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
        window.webContents.send("db-state-changed", state);
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
      if (db.dataSource?.isInitialized) {
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

      // Initialize the data source
      await AppDataSource.initialize();
      db.dataSource = AppDataSource;

      // Register entity handlers
      registerAudioHandlers();

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
      // Unregister entity handlers
      unregisterAudioHandlers();

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
    // Set up event listeners for login/logout
    appConfig.on("user:login", async (userId) => {
      logger.info(`User ${userId} logged in, connecting to database`);
      try {
        db.autoConnected = true;
        await db.connect({ retry: true });
      } catch (error) {
        logger.error("Failed to connect to database after login", error);
      }
    });

    appConfig.on("user:logout", async (user) => {
      logger.info(`User ${user?.id} logged out, disconnecting from database`);
      try {
        db.autoConnected = false;
        await db.disconnect();
      } catch (error) {
        logger.error("Failed to disconnect from database after logout", error);
      }
    });

    // Register IPC handlers
    db.registerIpcHandlers();
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

  // Register IPC handlers for database operations
  registerIpcHandlers: () => {
    ipcMain.handle("db-connect", async () => {
      if (db.isConnecting)
        return {
          state: "connecting",
          path: appConfig.dbPath(),
          error: null,
          autoConnected: db.autoConnected,
        };

      try {
        await db.connect();
        return db.currentState;
      } catch (err: any) {
        return db.currentState;
      }
    });

    ipcMain.handle("db-disconnect", async () => {
      await db.disconnect();
      return db.currentState;
    });

    ipcMain.handle("db-backup", async () => {
      await db.backup();
      return { state: "backup-completed" };
    });

    ipcMain.handle("db-status", async () => {
      return db.currentState;
    });
  },
};

export default db;
