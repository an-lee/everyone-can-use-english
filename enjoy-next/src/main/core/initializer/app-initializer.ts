import { BrowserWindow, ipcMain } from "electron";
import log from "@main/services/logger";
import { phaseRegistry, InitPhase } from "../plugin/phase-registry";
import {
  from,
  firstValueFrom,
  timer,
  race,
  Observable,
  EMPTY,
  throwError,
  mergeMap,
  catchError,
  of,
  concatMap,
  toArray,
  takeUntil,
} from "rxjs";
import { initObservables } from "./init-observables";

// Configure logger
const logger = log.scope("AppInitializer");

export class AppInitializer {
  private ipcHandlersRegistered: boolean = false;
  private startTime: number = 0;
  private defaultPhaseTimeout: number = 30000; // Default timeout: 30 seconds

  constructor() {
    // Set up automatic window updates based on state changes
    this.setupWindowUpdates();
  }

  /**
   * Subscribe to state changes and update windows
   */
  private setupWindowUpdates() {
    // Subscribe to state changes to broadcast to windows
    initObservables.state$.subscribe(() => this.broadcastStateToWindows());
    initObservables.progress$State.subscribe(() =>
      this.broadcastStateToWindows()
    );
    initObservables.currentPhase$State.subscribe(() =>
      this.broadcastStateToWindows()
    );
    initObservables.error$State.subscribe(() => this.broadcastStateToWindows());
    initObservables.message$State.subscribe(() =>
      this.broadcastStateToWindows()
    );
  }

  /**
   * Broadcast current state to all windows
   */
  private broadcastStateToWindows() {
    const state = initObservables.getCurrentState();

    // Only broadcast if there are windows
    const windows = BrowserWindow.getAllWindows();
    if (windows.length === 0) return;

    // Create the IPC format status object
    const status = {
      currentStep: state.currentPhase || "starting",
      progress: state.progress,
      error: state.error ? state.error.message : null,
      message: state.message,
    };

    // Send to all windows
    windows.forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send("app-init-status", status);
      }
    });
  }

  /**
   * Get the current initialization state
   */
  getState() {
    return initObservables.getCurrentState();
  }

  /**
   * Get simplified state for IPC communication
   */
  getStatusForIpc() {
    const state = initObservables.getCurrentState();
    return {
      currentStep: state.currentPhase || "starting",
      progress: state.progress,
      error: state.error ? state.error.message : null,
      message: state.message,
    };
  }

  /**
   * Set the default timeout for all phases that don't specify their own timeout
   */
  setDefaultPhaseTimeout(timeout: number): void {
    if (timeout < 1000) {
      logger.warn(
        `Default phase timeout ${timeout}ms is too low, using 1000ms instead`
      );
      this.defaultPhaseTimeout = 1000;
    } else {
      this.defaultPhaseTimeout = timeout;
      logger.debug(`Default phase timeout set to ${timeout}ms`);
    }
  }

  /**
   * Register IPC handlers for accessing initializer status
   */
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
    }
  }

  /**
   * Execute a phase with timeout handling using observables
   */
  private executePhase(phase: InitPhase): Observable<void> {
    // Skip if already completed
    const completedPhases = initObservables.getCurrentState().completedPhases;
    if (completedPhases.includes(phase.id)) {
      return EMPTY;
    }

    const phaseStartTime = Date.now();
    const timeout = phase.timeout || this.defaultPhaseTimeout;

    // Create an observable for the phase execution
    const execution$ = from(
      Promise.resolve().then(() => {
        // Emit phase started event
        initObservables.emitPhaseStarted(phase.id, phase.name);

        // Execute the phase
        return phase.execute();
      })
    );

    // Create a timeout observable
    const timeout$ = timer(timeout).pipe(
      mergeMap(() => {
        const duration = Date.now() - phaseStartTime;
        logger.warn(
          `Phase ${phase.name} timed out after ${duration}ms (timeout: ${timeout}ms)`
        );

        // Emit timeout event
        initObservables.emitPhaseTimeout(
          phase.id,
          phase.name,
          timeout,
          duration
        );

        // Reject with timeout error
        return throwError(
          () => new Error(`Phase ${phase.name} timed out after ${timeout}ms`)
        );
      })
    );

    // Race the execution against the timeout
    return race(execution$, timeout$).pipe(
      catchError((error) => {
        const duration = Date.now() - phaseStartTime;
        logger.error(`Phase ${phase.name} failed:`, error);

        // Only emit failed event if it's not a timeout (timeout already emitted its own event)
        if (!(error instanceof Error && error.message.includes("timed out"))) {
          initObservables.emitPhaseFailed(
            phase.id,
            phase.name,
            error instanceof Error ? error : new Error(String(error)),
            duration
          );
        }

        // Re-throw to propagate error
        return throwError(() => error);
      }),
      mergeMap(() => {
        const duration = Date.now() - phaseStartTime;

        // Emit phase completed event
        initObservables.emitPhaseCompleted(phase.id, phase.name, duration);

        logger.info(`Phase completed: ${phase.name} (${duration}ms)`);
        return EMPTY;
      })
    );
  }

  /**
   * Get phases that are ready to execute (all dependencies satisfied)
   */
  private getReadyPhases(): InitPhase[] {
    const completedPhases = initObservables.getCurrentState().completedPhases;
    return phaseRegistry
      .getPhases()
      .filter(
        (phase) =>
          !completedPhases.includes(phase.id) &&
          phase.dependencies.every((dep) => completedPhases.includes(dep))
      );
  }

  /**
   * Start the initialization process
   */
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

    const currentState = initObservables.getCurrentState();
    if (currentState.status === "in_progress") {
      logger.warn("Initialization already in progress");
      return;
    }

    this.startTime = Date.now();

    // Emit initialization started event
    initObservables.emitInitStarted(phaseRegistry.getPhases().length);

    try {
      const allPhases = phaseRegistry.getPhases();

      // Process phases in dependency order until all are completed
      while (true) {
        const readyPhases = this.getReadyPhases();
        if (readyPhases.length === 0) {
          // Check if all phases have been completed
          const completedPhases =
            initObservables.getCurrentState().completedPhases;
          if (completedPhases.length === allPhases.length) {
            break;
          }

          // Check for circular dependencies
          const remaining = allPhases.filter(
            (p) => !completedPhases.includes(p.id)
          );
          if (remaining.length > 0) {
            throw new Error(
              `Unable to resolve dependencies for remaining phases: ${remaining.map((p) => p.id).join(", ")}`
            );
          }
        }

        // Convert array of phases to observable stream and execute in parallel
        await firstValueFrom(
          from(readyPhases).pipe(
            // Process each phase in parallel
            mergeMap((phase) => this.executePhase(phase), 5),
            // Convert to promise once all are completed
            toArray(),
            // Handle errors
            catchError((error) => {
              throw error;
            })
          )
        );
      }

      const totalDuration = Date.now() - this.startTime;

      // Emit initialization completed event
      initObservables.emitInitCompleted(totalDuration);

      logger.info(
        `Application initialization completed successfully in ${totalDuration}ms`
      );
    } catch (error) {
      logger.error("Application initialization failed:", error);

      const errorObj =
        error instanceof Error ? error : new Error(String(error));

      // Emit initialization failed event
      initObservables.emitInitFailed(
        errorObj,
        initObservables.getCurrentState().currentPhase || undefined
      );

      throw error;
    }
  }
}

// Create and export a singleton instance
export const appInitializer = new AppInitializer();
export default appInitializer;
