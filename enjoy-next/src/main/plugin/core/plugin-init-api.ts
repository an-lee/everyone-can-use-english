import { log } from "@main/core/utils";
import {
  initHooks,
  InitPhase,
  initObservables,
  InitHookType,
  HookFunction,
} from "@main/core/app/initialization";
import { pluginPhaseAdapter } from "@main/plugin/core";
import { from, firstValueFrom, timeout, catchError } from "rxjs";

const logger = log.scope("PluginInitAPI");

/**
 * Plugin initialization API
 *
 * Provides methods for plugins to interact with the initialization system
 */
export const PluginInitAPI = {
  /**
   * Register a plugin initialization phase
   * @param pluginId The ID of the plugin registering the phase
   * @param phase The phase definition
   * @returns True if registration succeeded, false otherwise
   */
  registerPhase: (pluginId: string, phase: Omit<InitPhase, "id">): boolean => {
    // Create a namespaced phase ID to avoid conflicts
    const phaseId = `plugin:${pluginId}:${phase.name.toLowerCase().replace(/\s+/g, "_")}`;

    logger.info(`Plugin ${pluginId} is registering phase: ${phase.name}`);

    // Create the full phase with the namespaced ID
    const fullPhase: InitPhase = {
      ...phase,
      id: phaseId,
    };

    return pluginPhaseAdapter.registerPluginPhase(fullPhase, pluginId);
  },

  /**
   * Unregister a phase for a plugin
   * @param pluginId The ID of the plugin
   * @param phaseId The phase name or ID to unregister
   * @returns True if the phase was unregistered, false otherwise
   */
  unregisterPhase: (pluginId: string, phaseNameOrId: string): boolean => {
    // Handle both direct IDs and phase names
    let phaseId = phaseNameOrId;

    // If it looks like a phase name rather than ID, convert to ID format
    if (!phaseNameOrId.includes(":")) {
      phaseId = `plugin:${pluginId}:${phaseNameOrId.toLowerCase().replace(/\s+/g, "_")}`;
    }

    logger.info(`Plugin ${pluginId} is unregistering phase: ${phaseNameOrId}`);
    return pluginPhaseAdapter.getPhaseRegistry().unregisterPhase(phaseId);
  },

  /**
   * Get all registered phases
   * @returns Array of initialization phases
   */
  getPhases: (): InitPhase[] => {
    return pluginPhaseAdapter.getPhaseRegistry().getPhases();
  },

  /**
   * Register a hook
   * @param pluginId The plugin ID registering the hook
   * @param hookType The hook type
   * @param callback The hook callback function
   * @param order Optional execution order (lower numbers run first)
   * @returns Hook ID for later unregistration
   */
  registerHook: (
    pluginId: string,
    hookType: InitHookType,
    callback: HookFunction,
    order?: number
  ): string => {
    return initHooks.registerHook(pluginId, hookType, callback, order);
  },

  /**
   * Unregister a hook by ID
   * @param hookId The hook ID to unregister
   * @returns True if hook was found and unregistered
   */
  unregisterHook: (hookId: string): boolean => {
    return initHooks.unregisterHook(hookId);
  },

  /**
   * Unregister all hooks for a plugin
   * @param pluginId The plugin ID
   * @returns Number of hooks unregistered
   */
  unregisterPluginHooks: (pluginId: string): number => {
    return initHooks.unregisterPluginHooks(pluginId);
  },

  /**
   * Get available hook types
   * @returns Object containing all hook types
   */
  getHookTypes: () => {
    return InitHookType;
  },

  /**
   * Wait for a specific phase to complete
   * @param phaseId The phase ID to wait for
   * @param timeoutMs Optional timeout in milliseconds
   * @returns Promise resolving to true if phase completed, rejects on timeout
   */
  waitForPhase: async (
    phaseId: string,
    timeoutMs: number = 30000
  ): Promise<boolean> => {
    return firstValueFrom(
      from(initObservables.waitForPhase(phaseId)).pipe(
        timeout(timeoutMs),
        catchError((error) => {
          logger.error(`Timeout waiting for phase ${phaseId}`, error);
          throw error;
        })
      )
    );
  },
};

export default PluginInitAPI;
