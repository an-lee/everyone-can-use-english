import { PluginContext } from "@/types/plugin";
import {
  firstValueFrom,
  filter,
  Observable,
  timer,
  race,
  map,
  of,
  BehaviorSubject,
  distinctUntilChanged,
} from "rxjs";

// Plugin state management with observables
class ExamplePluginState {
  // Plugin state as observables
  private count$ = new BehaviorSubject<number>(0);
  private status$ = new BehaviorSubject<"idle" | "working" | "done">("idle");

  // Get current values
  get count() {
    return this.count$.getValue();
  }
  get status() {
    return this.status$.getValue();
  }

  // Access as observables (read-only)
  get count$Observable() {
    return this.count$.asObservable();
  }
  get status$Observable() {
    return this.status$.asObservable();
  }

  // Update state
  increment() {
    this.count$.next(this.count$.getValue() + 1);
  }

  setStatus(status: "idle" | "working" | "done") {
    this.status$.next(status);
  }

  reset() {
    this.count$.next(0);
    this.status$.next("idle");
  }
}

export const activate = async (context: PluginContext) => {
  console.log("Example plugin activated with Observable pattern");

  // Create plugin state
  const pluginState = new ExamplePluginState();

  // Store unsubscribe functions
  const unsubscribers: Array<() => void> = [];

  // Get hook types
  const hookTypes = context.getInitHookTypes();

  // Register a custom initialization phase with a timeout
  context.registerInitPhase({
    name: "Example Plugin Setup",
    description: "Preparing example plugin resources",
    // This phase depends on the core database being ready
    dependencies: ["database"],
    // Add a 5 second timeout for this phase
    timeout: 5000,
    execute: async () => {
      console.log("Example plugin initialization phase running");

      // Set state to working
      pluginState.setStatus("working");

      // Using Observable for our async work (with inner timeout)
      await firstValueFrom(
        new Observable((subscriber) => {
          console.log("Loading example plugin resources...");

          // Simulate async work
          setTimeout(() => {
            subscriber.next("Resources loaded");
            subscriber.complete();
          }, 500);
        })
      );

      // Set state to done
      pluginState.setStatus("done");
      console.log("Example plugin initialization complete");
    },
  });

  // Subscribe to state changes to demonstrate observables
  const statusSubscription = pluginState.status$Observable
    .pipe(distinctUntilChanged())
    .subscribe((status) => {
      console.log(`Plugin status changed to: ${status}`);
    });

  // Add to unsubscribers
  unsubscribers.push(() => statusSubscription.unsubscribe());

  // Register hooks for various initialization events
  context.registerInitHook(hookTypes.BEFORE_INIT, () => {
    console.log("Example plugin: Before initialization hook");
  });

  context.registerInitHook(hookTypes.AFTER_INIT, () => {
    console.log("Example plugin: After initialization hook");
    pluginState.setStatus("idle");
  });

  // Register a hook that runs before the database phase
  context.registerInitHook(hookTypes.BEFORE_PHASE, (phaseId: string) => {
    if (phaseId === "database") {
      console.log("Example plugin: Before database phase hook");
    }
  });

  // Register a hook that runs after any phase
  context.registerInitHook(hookTypes.AFTER_PHASE, (phaseId: string) => {
    console.log(`Example plugin: After phase "${phaseId}" hook`);
  });

  // Register a hook for phase timeouts with custom error handling
  context.registerInitHook(hookTypes.PHASE_TIMEOUT, (phaseId, timeout) => {
    console.log(
      `Example plugin: Phase ${phaseId} timed out after ${timeout}ms`
    );

    // Demonstrate reactive recovery for timed out slow phase
    if (phaseId === "plugin:example:example_slow_phase") {
      console.log("Performing reactive recovery for timed out slow phase");
      // In a real plugin, you could clean up resources or try an alternative approach
    }
  });

  // Register an increment counter command
  context.registerCommand("incrementCounter", async () => {
    pluginState.increment();
    console.log(`Counter incremented to: ${pluginState.count}`);
    return {
      success: true,
      count: pluginState.count,
    };
  });

  // Register a command to reset the counter and state
  context.registerCommand("resetState", async () => {
    pluginState.reset();
    console.log("Plugin state reset");
    return {
      success: true,
      count: pluginState.count,
      status: pluginState.status,
    };
  });

  // Register a command that demonstrates waiting for a phase
  context.registerCommand(
    "waitForPhase",
    async ({ phaseId }: { phaseId: string }) => {
      if (!phaseId) {
        return { success: false, error: "Phase ID is required" };
      }

      console.log(`Waiting for phase ${phaseId} to complete...`);

      try {
        // The new API has a built-in observable-based waitForPhase method
        await context.waitForPhase(phaseId, 5000);
        return { success: true, message: `Phase ${phaseId} completed` };
      } catch (error: any) {
        return {
          success: false,
          error: `Failed to wait for phase: ${error.message}`,
        };
      }
    }
  );

  // Register a command that lists all initialization phases
  context.registerCommand("listInitPhases", async () => {
    const phases = context.getInitPhases();
    console.log("Current initialization phases:", phases);
    return { phases };
  });

  // Register a command to test unregistering hooks
  context.registerCommand("unregisterBeforeDatabaseHook", async () => {
    const beforeDbHookId = context.registerInitHook(
      hookTypes.BEFORE_PHASE,
      (phaseId: string) => {
        console.log(
          `This hook for ${phaseId} will be immediately unregistered`
        );
      }
    );

    const unregistered = context.unregisterInitHook(beforeDbHookId);
    return { success: unregistered };
  });

  // Clean up when deactivated
  return {
    deactivate: () => {
      // Unregister our initialization phases
      context.unregisterInitPhase("Example Plugin Setup");

      // Unsubscribe from all observables
      unsubscribers.forEach((unsubscribe) => unsubscribe());

      console.log("Example plugin deactivated");
    },
  };
};
