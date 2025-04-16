import { app } from "electron";
import path from "path";
import fs from "fs-extra";
import { log } from "@main/core/utils";
import {
  PluginInitAPI,
  pluginPhaseAdapter,
  pluginObservables,
} from "@main/plugin/core";
import { Subject, Subscription } from "rxjs";

const logger = log.scope("plugin-context");

// Type for event subscriptions
type EventCallback = (...args: any[]) => void;

/**
 * Context cleanup handler - not part of the public API
 */
export interface PluginContextCleanup extends PluginContext {
  /**
   * Clean up resources when plugin is deactivated
   */
  cleanup(): void;
}

/**
 * Create a plugin context for a specific plugin
 */
export function createPluginContext(
  manifest: PluginManifest,
  isBuiltIn: boolean
): PluginContextCleanup {
  const pluginId = manifest.id;
  const pluginLogger = log.scope(`plugin:${pluginId}`);

  // Determine storage path for the plugin
  const storagePath = isBuiltIn
    ? path.join(app.getPath("userData"), "plugin-data", pluginId)
    : path.join(app.getPath("userData"), "plugins", pluginId, "data");

  // Ensure the storage directory exists
  fs.ensureDirSync(storagePath);

  // Track subscriptions to clean up
  const subscriptions: Subscription[] = [];

  // Track hook IDs to clean up
  const hookIds: string[] = [];

  // Custom event subjects for this plugin - allows publishing/subscribing
  const eventSubjects = new Map<string, Subject<any>>();

  // Get a subject for a given event name
  const getEventSubject = (event: string): Subject<any> => {
    if (!eventSubjects.has(event)) {
      eventSubjects.set(event, new Subject<any>());
    }
    return eventSubjects.get(event)!;
  };

  // Create and return the plugin context
  const context: PluginContext = {
    registerCommand(id: string, callback: (...args: any[]) => any): void {
      const commandId = `${pluginId}.${id}`;

      // Register in the plugin observables system
      pluginObservables.registerCommand(pluginId, commandId, callback);

      pluginLogger.debug(`Registered command: ${commandId}`);
    },

    registerView(id: string, component: any): void {
      const viewId = `${pluginId}.${id}`;

      // Register in the plugin observables system
      pluginObservables.registerView(pluginId, viewId, component);

      pluginLogger.debug(`Registered view: ${viewId}`);
    },

    registerInitPhase(phase: Omit<InitPhase, "id">): void {
      // Create a complete phase with the plugin's ID as a prefix
      const fullPhase: InitPhase = {
        ...phase,
        id: `${manifest.id}-${phase.name.toLowerCase().replace(/\s+/g, "-")}`,
      };

      // Use the adapter instead of direct registration
      pluginPhaseAdapter.registerPluginPhase(fullPhase, manifest.id);
      pluginLogger.debug(`Registered initialization phase: ${fullPhase.id}`);
    },

    unregisterInitPhase(phaseId: string): void {
      // Use the adapter's method to unregister plugin phases
      const phases = pluginPhaseAdapter.getPluginPhases(manifest.id);
      const phaseToRemove = phases.find(
        (p) => p.id.endsWith(phaseId) || p.id === phaseId
      );

      if (phaseToRemove) {
        const registry = pluginPhaseAdapter.getPhaseRegistry();
        registry.unregisterPhase(phaseToRemove.id);
        pluginLogger.debug(
          `Unregistered initialization phase: ${phaseToRemove.id}`
        );
      }
    },

    getInitPhases(): Array<{
      id: string;
      name: string;
      dependencies: string[];
    }> {
      // Get all phases from the registry through the adapter
      return pluginPhaseAdapter
        .getPhaseRegistry()
        .getPhases()
        .map((phase) => ({
          id: phase.id,
          name: phase.name,
          dependencies: phase.dependencies,
        }));
    },

    registerInitHook(
      hookType: InitHookType,
      callback: HookFunction,
      order?: number
    ): string {
      const hookId = PluginInitAPI.registerHook(
        pluginId,
        hookType,
        callback,
        order
      );
      hookIds.push(hookId);
      return hookId;
    },

    unregisterInitHook(hookId: string): boolean {
      const result = PluginInitAPI.unregisterHook(hookId);
      if (result) {
        const index = hookIds.indexOf(hookId);
        if (index >= 0) {
          hookIds.splice(index, 1);
        }
      }
      return result;
    },

    getInitHookTypes(): typeof InitHookType {
      return PluginInitAPI.getHookTypes();
    },

    registerPhaseTimeoutHandler(
      phaseId: string | undefined,
      callback: (phaseId: string, timeout: number) => Promise<void> | void
    ) {
      const wrappedCallback = (id: string, timeout: number) => {
        if (!phaseId || id === phaseId) {
          return callback(id, timeout);
        }
      };

      // Pass the correct HookFunction type
      return context.registerInitHook(
        InitHookType.PHASE_TIMEOUT,
        wrappedCallback as any
      );
    },

    subscribe(event: string, callback: EventCallback): () => void {
      const subject = getEventSubject(event);
      const subscription = subject.subscribe((...args) => callback(...args));

      subscriptions.push(subscription);
      pluginLogger.debug(`Subscribed to event: ${event}`);

      // Return unsubscribe function
      return () => {
        subscription.unsubscribe();
        const index = subscriptions.indexOf(subscription);
        if (index >= 0) {
          subscriptions.splice(index, 1);
        }
      };
    },

    publish(event: string, ...args: any[]): void {
      const subject = getEventSubject(event);
      subject.next(args);
      pluginLogger.debug(`Published event: ${event}`);
    },

    getStoragePath(): string {
      return storagePath;
    },

    getService<T>(name: string): T | undefined {
      return pluginObservables.getService(name);
    },

    waitForPhase(phaseId: string, timeoutMs?: number): Promise<boolean> {
      return PluginInitAPI.waitForPhase(phaseId, timeoutMs);
    },
  };

  // Return context with cleanup method
  return {
    ...context,
    cleanup: () => {
      // Unsubscribe all subscriptions
      subscriptions.forEach((sub) => sub.unsubscribe());
      subscriptions.length = 0;

      // Unregister all hooks
      hookIds.forEach((id) => PluginInitAPI.unregisterHook(id));
      hookIds.length = 0;

      // Clear event subjects
      eventSubjects.forEach((subject) => subject.complete());
      eventSubjects.clear();

      // Emit plugin deactivated event
      pluginObservables.emitPluginDeactivated(pluginId);

      pluginLogger.debug(`Plugin context cleanup completed for ${pluginId}`);
    },
  };
}

/**
 * Execute a command by ID
 */
export async function executeCommand(
  commandId: string,
  ...args: any[]
): Promise<any> {
  try {
    return await pluginObservables.executeCommand(commandId, ...args);
  } catch (error) {
    logger.error(`Error executing command ${commandId}`, error);
    throw error;
  }
}

/**
 * Get all registered commands
 */
export function getCommands(): Record<string, any> {
  return pluginObservables.getAllCommands();
}

/**
 * Register a global service
 */
export function registerService(name: string, service: any): void {
  logger.info(`Registering service: ${name}`);
  pluginObservables.registerService("system", name, service);
}

/**
 * Publish a global event
 */
export const publishEvent = (eventName: string, data?: any) => {
  pluginObservables.emitSystemEvent(eventName, data);
  logger.debug(`Publishing event: ${eventName}`, data || "");
};
