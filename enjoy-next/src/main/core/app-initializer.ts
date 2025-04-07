import { BrowserWindow, ipcMain } from "electron";
import log from "@main/services/logger";
import { phaseRegistry, InitPhase } from "./phase-registry";

// Configure logger
const logger = log.scope("AppInitializer");

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
    // No need to register phases here anymore - they're registered in the PhaseRegistry
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
    const phases = phaseRegistry.getPhases();
    if (phases.length > 0) {
      this.state.progress = Math.round(
        (this.state.completedPhases.length / phases.length) * 100
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
    return phaseRegistry
      .getPhases()
      .filter(
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
    // Check for dependency cycles before starting
    const cycles = phaseRegistry.detectCycles();
    if (cycles.length > 0) {
      throw new Error(
        `Circular dependencies detected in phases: ${cycles.join(", ")}`
      );
    }

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
      const allPhases = phaseRegistry.getPhases();
      // Process phases in dependency order until all are completed
      while (true) {
        const readyPhases = this.getReadyPhases();
        if (readyPhases.length === 0) {
          // Check if all phases have been completed
          if (this.state.completedPhases.length === allPhases.length) {
            break;
          }

          // Check for circular dependencies
          const remaining = allPhases.filter(
            (p) => !this.state.completedPhases.includes(p.id)
          );
          if (remaining.length > 0) {
            throw new Error(
              `Unable to resolve dependencies for remaining phases: ${remaining.map((p) => p.id).join(", ")}`
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
