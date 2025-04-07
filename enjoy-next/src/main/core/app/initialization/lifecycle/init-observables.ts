import {
  Subject,
  BehaviorSubject,
  firstValueFrom,
  filter,
  map,
  take,
} from "rxjs";
import log from "@/main/core/utils/logger";

const logger = log.scope("InitObservables");

// Event types
export enum InitEventType {
  // Core lifecycle events
  INIT_STARTED = "init:started",
  INIT_COMPLETED = "init:completed",
  INIT_FAILED = "init:failed",

  // Phase events
  PHASE_STARTED = "phase:started",
  PHASE_COMPLETED = "phase:completed",
  PHASE_FAILED = "phase:failed",
  PHASE_TIMEOUT = "phase:timeout",

  // Progress events
  PROGRESS_UPDATED = "progress:updated",
}

// Base event interface
export interface InitEvent {
  type: InitEventType;
  timestamp: number;
}

// Phase events
export interface PhaseEvent extends InitEvent {
  phaseId: string;
  phaseName: string;
}

export interface PhaseTimeoutEvent extends PhaseEvent {
  timeout: number;
  duration: number;
}

export interface PhaseCompletedEvent extends PhaseEvent {
  duration: number;
}

export interface PhaseFailedEvent extends PhaseEvent {
  error: Error;
  duration: number;
}

// Progress events
export interface ProgressUpdatedEvent extends InitEvent {
  progress: number;
  message: string;
  currentPhase?: string;
}

// Initialization lifecycle events
export interface InitStartedEvent extends InitEvent {
  totalPhases: number;
}

export interface InitCompletedEvent extends InitEvent {
  totalDuration: number;
}

export interface InitFailedEvent extends InitEvent {
  error: Error;
  failedPhase?: string;
}

// Define union types for each event category
type PhaseEvents =
  | PhaseEvent
  | PhaseCompletedEvent
  | PhaseFailedEvent
  | PhaseTimeoutEvent;
type ProgressEvents = ProgressUpdatedEvent;
type LifecycleEvents = InitStartedEvent | InitCompletedEvent | InitFailedEvent;

// All possible event types
export type InitEvents = PhaseEvents | ProgressEvents | LifecycleEvents;

/**
 * Observable-based initialization event system
 */
class InitObservables {
  // Main event stream
  private events$ = new Subject<InitEvents>();

  // State streams
  private initState$ = new BehaviorSubject<
    "pending" | "in_progress" | "completed" | "error"
  >("pending");
  private progress$ = new BehaviorSubject<number>(0);
  private currentPhase$ = new BehaviorSubject<string | null>(null);
  private completedPhases$ = new BehaviorSubject<string[]>([]);
  private error$ = new BehaviorSubject<Error | null>(null);
  private message$ = new BehaviorSubject<string>("Initialization pending...");

  // Filter helpers for specific event types
  private filterEventType<T extends InitEvents>(type: InitEventType) {
    return this.events$.pipe(
      filter((event): event is T => event.type === type)
    );
  }

  // Event streams
  public phaseStarted$ = this.filterEventType<PhaseEvent>(
    InitEventType.PHASE_STARTED
  );
  public phaseCompleted$ = this.filterEventType<PhaseCompletedEvent>(
    InitEventType.PHASE_COMPLETED
  );
  public phaseFailed$ = this.filterEventType<PhaseFailedEvent>(
    InitEventType.PHASE_FAILED
  );
  public phaseTimeout$ = this.filterEventType<PhaseTimeoutEvent>(
    InitEventType.PHASE_TIMEOUT
  );
  public progressUpdated$ = this.filterEventType<ProgressUpdatedEvent>(
    InitEventType.PROGRESS_UPDATED
  );
  public initStarted$ = this.filterEventType<InitStartedEvent>(
    InitEventType.INIT_STARTED
  );
  public initCompleted$ = this.filterEventType<InitCompletedEvent>(
    InitEventType.INIT_COMPLETED
  );
  public initFailed$ = this.filterEventType<InitFailedEvent>(
    InitEventType.INIT_FAILED
  );

  // State observables (read-only)
  public get state$() {
    return this.initState$.asObservable();
  }
  public get progress$State() {
    return this.progress$.asObservable();
  }
  public get currentPhase$State() {
    return this.currentPhase$.asObservable();
  }
  public get completedPhases$State() {
    return this.completedPhases$.asObservable();
  }
  public get error$State() {
    return this.error$.asObservable();
  }
  public get message$State() {
    return this.message$.asObservable();
  }

  constructor() {
    // Set up event listeners to update state
    this.setupStateUpdates();
  }

  /**
   * Set up automatic state updates based on events
   */
  private setupStateUpdates() {
    // Update state on init started
    this.initStarted$.subscribe(() => {
      this.initState$.next("in_progress");
      this.progress$.next(0);
      this.completedPhases$.next([]);
      this.error$.next(null);
      this.message$.next("Starting initialization...");
    });

    // Update phase on phase started
    this.phaseStarted$.subscribe((event) => {
      this.currentPhase$.next(event.phaseId);
      this.message$.next(`Executing phase: ${event.phaseName}`);
    });

    // Update completed phases on phase completed
    this.phaseCompleted$.subscribe((event) => {
      const current = this.completedPhases$.getValue();
      if (!current.includes(event.phaseId)) {
        this.completedPhases$.next([...current, event.phaseId]);
      }
    });

    // Update error state on phase failed
    this.phaseFailed$.subscribe((event) => {
      this.error$.next(event.error);
      this.initState$.next("error");
      this.message$.next(
        `Error in phase ${event.phaseName}: ${event.error.message}`
      );
    });

    // Update on timeout
    this.phaseTimeout$.subscribe((event) => {
      this.error$.next(
        new Error(
          `Phase ${event.phaseName} timed out after ${event.duration}ms`
        )
      );
      this.initState$.next("error");
      this.message$.next(
        `Timeout in phase ${event.phaseName} (${event.timeout}ms)`
      );
    });

    // Update on progress update
    this.progressUpdated$.subscribe((event) => {
      this.progress$.next(event.progress);
      this.message$.next(event.message);
      if (event.currentPhase) {
        this.currentPhase$.next(event.currentPhase);
      }
    });

    // Handle initialization completion
    this.initCompleted$.subscribe(() => {
      this.initState$.next("completed");
      this.currentPhase$.next("ready");
      this.progress$.next(100);
      this.message$.next("Application initialized successfully");
    });

    // Handle initialization failure
    this.initFailed$.subscribe((event) => {
      this.initState$.next("error");
      this.error$.next(event.error);
      this.message$.next(`Initialization failed: ${event.error.message}`);
    });
  }

  /**
   * Emit an event to the event stream
   */
  private emit(event: InitEvents) {
    logger.debug(`Emitting ${event.type} event`);
    this.events$.next(event);
  }

  // Phase event emitters
  emitPhaseStarted(phaseId: string, phaseName: string): void {
    this.emit({
      type: InitEventType.PHASE_STARTED,
      timestamp: Date.now(),
      phaseId,
      phaseName,
    });
  }

  emitPhaseCompleted(
    phaseId: string,
    phaseName: string,
    duration: number
  ): void {
    this.emit({
      type: InitEventType.PHASE_COMPLETED,
      timestamp: Date.now(),
      phaseId,
      phaseName,
      duration,
    });
  }

  emitPhaseFailed(
    phaseId: string,
    phaseName: string,
    error: Error,
    duration: number
  ): void {
    this.emit({
      type: InitEventType.PHASE_FAILED,
      timestamp: Date.now(),
      phaseId,
      phaseName,
      error,
      duration,
    });
  }

  emitPhaseTimeout(
    phaseId: string,
    phaseName: string,
    timeout: number,
    duration: number
  ): void {
    this.emit({
      type: InitEventType.PHASE_TIMEOUT,
      timestamp: Date.now(),
      phaseId,
      phaseName,
      timeout,
      duration,
    });
  }

  emitProgressUpdated(
    progress: number,
    message: string,
    currentPhase?: string
  ): void {
    this.emit({
      type: InitEventType.PROGRESS_UPDATED,
      timestamp: Date.now(),
      progress,
      message,
      currentPhase,
    });
  }

  // Lifecycle event emitters
  emitInitStarted(totalPhases: number): void {
    this.emit({
      type: InitEventType.INIT_STARTED,
      timestamp: Date.now(),
      totalPhases,
    });
  }

  emitInitCompleted(totalDuration: number): void {
    this.emit({
      type: InitEventType.INIT_COMPLETED,
      timestamp: Date.now(),
      totalDuration,
    });
  }

  emitInitFailed(error: Error, failedPhase?: string): void {
    this.emit({
      type: InitEventType.INIT_FAILED,
      timestamp: Date.now(),
      error,
      failedPhase,
    });
  }

  /**
   * Get the current initialization state
   */
  getCurrentState() {
    return {
      status: this.initState$.getValue(),
      currentPhase: this.currentPhase$.getValue(),
      progress: this.progress$.getValue(),
      error: this.error$.getValue(),
      message: this.message$.getValue(),
      completedPhases: this.completedPhases$.getValue(),
    };
  }

  /**
   * Wait for a specific phase to complete
   */
  async waitForPhase(
    phaseId: string,
    timeout: number = 30000
  ): Promise<boolean> {
    // If phase already completed, return immediately
    if (this.completedPhases$.getValue().includes(phaseId)) {
      return true;
    }

    // Wait for either the phase to complete or timeout
    return firstValueFrom(
      this.phaseCompleted$.pipe(
        filter((event) => event.phaseId === phaseId),
        take(1),
        map(() => true)
      )
    );
  }

  /**
   * Wait for initialization to complete
   */
  async waitForCompletion(timeout: number = 60000): Promise<boolean> {
    if (this.initState$.getValue() === "completed") {
      return true;
    }

    return firstValueFrom(
      this.state$.pipe(
        filter((state) => state === "completed"),
        take(1),
        map(() => true)
      )
    );
  }
}

// Create and export a singleton instance
export const initObservables = new InitObservables();
export default initObservables;
