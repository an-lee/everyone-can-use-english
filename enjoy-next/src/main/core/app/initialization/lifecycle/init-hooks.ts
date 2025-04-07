import log from "@main/core/utils/logger";
import { v4 as uuidv4 } from "uuid";
import { initObservables } from "@main/core/app/initialization/lifecycle/init-observables";
import { takeUntil, Subject } from "rxjs";

const logger = log.scope("InitHooks");

// Hook types
export enum InitHookType {
  // Global hooks
  BEFORE_INIT = "before:init",
  AFTER_INIT = "after:init",
  INIT_FAILED = "init:failed",

  // Phase-specific hooks
  BEFORE_PHASE = "before:phase",
  AFTER_PHASE = "after:phase",
  PHASE_FAILED = "phase:failed",
  PHASE_TIMEOUT = "phase:timeout",
}

// Hook function types
export type BeforeInitHook = () => Promise<void> | void;
export type AfterInitHook = () => Promise<void> | void;
export type InitFailedHook = (error: Error) => Promise<void> | void;
export type BeforePhaseHook = (phaseId: string) => Promise<void> | void;
export type AfterPhaseHook = (phaseId: string) => Promise<void> | void;
export type PhaseFailedHook = (
  phaseId: string,
  error: Error
) => Promise<void> | void;
export type PhaseTimeoutHook = (
  phaseId: string,
  timeout: number
) => Promise<void> | void;

// Union type for all hook types
export type HookFunction =
  | BeforeInitHook
  | AfterInitHook
  | InitFailedHook
  | BeforePhaseHook
  | AfterPhaseHook
  | PhaseFailedHook
  | PhaseTimeoutHook;

// Hook registration entry
type HookEntry = {
  id: string;
  type: InitHookType;
  pluginId?: string;
  order: number;
  fn: HookFunction;
};

class InitHookManager {
  private hooks: HookEntry[] = [];
  private unsubscribe$ = new Subject<void>();

  constructor() {
    this.setupObservableSubscriptions();
  }

  /**
   * Set up subscriptions to observable events
   */
  private setupObservableSubscriptions() {
    // Listen for initialization start
    initObservables.initStarted$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(async () => {
        await this.executeHooks(InitHookType.BEFORE_INIT);
      });

    // Listen for initialization completion
    initObservables.initCompleted$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(async () => {
        await this.executeHooks(InitHookType.AFTER_INIT);
      });

    // Listen for initialization failure
    initObservables.initFailed$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(async (event) => {
        await this.executeHooks(InitHookType.INIT_FAILED, event.error);
      });

    // Listen for phase start
    initObservables.phaseStarted$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(async (event) => {
        await this.executeHooks(InitHookType.BEFORE_PHASE, event.phaseId);
      });

    // Listen for phase completion
    initObservables.phaseCompleted$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(async (event) => {
        await this.executeHooks(InitHookType.AFTER_PHASE, event.phaseId);
      });

    // Listen for phase failure
    initObservables.phaseFailed$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(async (event) => {
        await this.executeHooks(
          InitHookType.PHASE_FAILED,
          event.phaseId,
          event.error
        );
      });

    // Listen for phase timeout
    initObservables.phaseTimeout$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(async (event) => {
        await this.executeHooks(
          InitHookType.PHASE_TIMEOUT,
          event.phaseId,
          event.timeout
        );
      });
  }

  /**
   * Register a hook to be executed at a specific point in initialization
   */
  registerHook(
    pluginId: string | undefined,
    type: InitHookType,
    fn: HookFunction,
    order: number = 50
  ): string {
    const id = uuidv4();
    this.hooks.push({
      id,
      type,
      pluginId,
      order,
      fn,
    });

    logger.debug(
      `Registered hook ${id} of type ${type}${
        pluginId ? ` for plugin ${pluginId}` : ""
      } with order ${order}`
    );

    return id;
  }

  /**
   * Unregister a hook by ID
   */
  unregisterHook(hookId: string): boolean {
    const initialLength = this.hooks.length;
    this.hooks = this.hooks.filter((h) => h.id !== hookId);

    const removed = initialLength > this.hooks.length;
    if (removed) {
      logger.debug(`Unregistered hook ${hookId}`);
    }

    return removed;
  }

  /**
   * Unregister all hooks for a specific plugin
   */
  unregisterPluginHooks(pluginId: string): number {
    const initialLength = this.hooks.length;
    this.hooks = this.hooks.filter((h) => h.pluginId !== pluginId);

    const removed = initialLength - this.hooks.length;
    if (removed > 0) {
      logger.debug(`Unregistered ${removed} hooks for plugin ${pluginId}`);
    }

    return removed;
  }

  /**
   * Get hooks of a specific type
   */
  getHooks(type: InitHookType): HookEntry[] {
    return this.hooks
      .filter((h) => h.type === type)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Execute hooks of a specific type with arguments
   * This method will execute hooks in order of their priority
   */
  async executeHooks(type: InitHookType, ...args: any[]): Promise<void> {
    const hooks = this.getHooks(type);
    if (hooks.length === 0) return;

    logger.debug(`Executing ${hooks.length} hooks of type ${type}`);

    // Execute hooks in sequence based on their order
    for (const hook of hooks) {
      try {
        await (hook.fn as any)(...args);
      } catch (error) {
        logger.error(`Error executing hook ${hook.id} of type ${type}:`, error);
      }
    }
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}

// Create and export a singleton instance
export const initHooks = new InitHookManager();
export default initHooks;
