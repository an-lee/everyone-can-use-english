import { BrowserWindow, ipcMain } from "electron";
import log from "@main/services/logger";
import appConfig from "@main/config/app-config";
import db from "@main/storage";
import pluginManager from "@main/core/plugin-manager";
import { publishEvent } from "@main/core/plugin-context";

// Configure logger
const logger = log.scope("AppInitializer");

// Definition of initialization phases
export type InitPhase = {
  id: string;
  name: string;
  description: string;
  dependencies: string[];
  execute: () => Promise<void>;
};

// Initialization state
export type InitState = {
  status: "pending" | "in_progress" | "completed" | "error";
  currentPhase: string | null;
  progress: number;
  error: Error | null;
  message: string;
  completedPhases: string[];
};

export class AppInitializer {
  private phases: InitPhase[] = [];
  private state: InitState = {
    status: "pending",
    currentPhase: null,
    progress: 0,
    error: null,
    message: "Initialization pending...",
    completedPhases: [],
  };
  private ipcHandlersRegistered: boolean = false;

  constructor() {
    // Register default initialization phases
    this.registerPhase({
      id: "config",
      name: "Configuration",
      description: "Loading application configuration",
      dependencies: [],
      execute: async () => {
        await appConfig.initialize();
      },
    });

    this.registerPhase({
      id: "plugin_system",
      name: "Plugin System",
      description: "Initializing plugin system",
      dependencies: ["config"],
      execute: async () => {
        await pluginManager.init();
      },
    });

    this.registerPhase({
      id: "plugins_activation",
      name: "Plugins Activation",
      description: "Activating plugins",
      dependencies: ["plugin_system"],
      execute: async () => {
        await pluginManager.activatePlugins();
      },
    });

    this.registerPhase({
      id: "database",
      name: "Database",
      description: "Setting up database connection",
      dependencies: ["config"],
      execute: async () => {
        db.init();
        // Database actual connection happens when user logs in
      },
    });

    this.registerPhase({
      id: "app_ready",
      name: "Application Ready",
      description: "Publishing application ready event",
      dependencies: ["plugin_system", "plugins_activation", "database"],
      execute: async () => {
        publishEvent("app:ready");
      },
    });
  }

  // Register a new initialization phase
  registerPhase(phase: InitPhase): void {
    // Check if phase with same id already exists
    const existingIndex = this.phases.findIndex((p) => p.id === phase.id);
    if (existingIndex >= 0) {
      this.phases[existingIndex] = phase;
    } else {
      this.phases.push(phase);
    }
  }

  // Get the current initialization state
  getState(): InitState {
    return { ...this.state };
  }

  // Get simplified state for IPC communication
  getStatusForIpc() {
    return {
      currentStep: this.state.currentPhase || "starting",
      progress: this.state.progress,
      error: this.state.error ? this.state.error.message : null,
      message: this.state.message,
    };
  }

  // Register IPC handlers for accessing initializer status
  private registerIpcHandlers() {
    if (this.ipcHandlersRegistered) {
      logger.debug("AppInitializer IPC handlers already registered, skipping");
      return;
    }

    try {
      ipcMain.handle("app-initializer:status", () => this.getStatusForIpc());
      this.ipcHandlersRegistered = true;
      logger.debug("AppInitializer IPC handlers registered");
    } catch (error) {
      logger.error("Failed to register AppInitializer IPC handlers", error);
      // Don't set ipcHandlersRegistered to true if there was an error
    }
  }

  // Update initialization state and broadcast to all windows
  private updateState(updates: Partial<InitState>): void {
    this.state = { ...this.state, ...updates };

    // Calculate progress based on completed phases
    if (this.phases.length > 0) {
      this.state.progress = Math.round(
        (this.state.completedPhases.length / this.phases.length) * 100
      );
    }

    logger.debug(
      `Init state update: ${this.state.currentPhase} - ${this.state.message} (${this.state.progress}%)`
    );

    // Broadcast to all windows
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send("app-init-status", {
          currentStep: this.state.currentPhase || "starting",
          progress: this.state.progress,
          error: this.state.error ? this.state.error.message : null,
          message: this.state.message,
        });
      }
    });
  }

  // Get phases that are ready to execute (all dependencies satisfied)
  private getReadyPhases(): InitPhase[] {
    return this.phases.filter(
      (phase) =>
        !this.state.completedPhases.includes(phase.id) &&
        phase.dependencies.every((dep) =>
          this.state.completedPhases.includes(dep)
        )
    );
  }

  // Execute a specific phase
  private async executePhase(phase: InitPhase): Promise<void> {
    if (this.state.completedPhases.includes(phase.id)) {
      return;
    }

    this.updateState({
      currentPhase: phase.id,
      message: phase.description,
    });

    try {
      await phase.execute();
      this.state.completedPhases.push(phase.id);
      logger.info(`Phase completed: ${phase.name}`);
    } catch (error) {
      logger.error(`Phase ${phase.name} failed:`, error);
      this.updateState({
        status: "error",
        error: error instanceof Error ? error : new Error(String(error)),
        message: `Error in ${phase.name}: ${error instanceof Error ? error.message : String(error)}`,
      });
      throw error;
    }
  }

  // Start the initialization process
  async initialize(): Promise<void> {
    // Register IPC handlers before starting initialization
    this.registerIpcHandlers();

    if (this.state.status === "in_progress") {
      logger.warn("Initialization already in progress");
      return;
    }

    this.updateState({
      status: "in_progress",
      currentPhase: null,
      progress: 0,
      error: null,
      message: "Starting initialization...",
      completedPhases: [],
    });

    try {
      // Process phases in dependency order until all are completed
      while (true) {
        const readyPhases = this.getReadyPhases();
        if (readyPhases.length === 0) {
          // Check if all phases have been completed
          if (this.state.completedPhases.length === this.phases.length) {
            break;
          }

          // Check for circular dependencies
          const remaining = this.phases.filter(
            (p) => !this.state.completedPhases.includes(p.id)
          );
          if (remaining.length > 0) {
            throw new Error(
              `Circular dependency detected or missing dependency. Remaining phases: ${remaining.map((p) => p.id).join(", ")}`
            );
          }
        }

        // Execute all ready phases in parallel
        await Promise.all(readyPhases.map((phase) => this.executePhase(phase)));
      }

      this.updateState({
        status: "completed",
        currentPhase: "ready",
        progress: 100,
        message: "Application initialized successfully",
      });

      logger.info("Application initialization completed successfully");
    } catch (error) {
      logger.error("Application initialization failed:", error);
      this.updateState({
        status: "error",
        error: error instanceof Error ? error : new Error(String(error)),
        message: `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      });
      throw error;
    }
  }
}

// Create and export a singleton instance
export const appInitializer = new AppInitializer();
export default appInitializer;
