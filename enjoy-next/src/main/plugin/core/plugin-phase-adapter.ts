import { phaseRegistry } from "@main/core/app/initialization";
import { log } from "@main/core/utils";

const logger = log.scope("PluginPhaseAdapter");

/**
 * Adapter class to provide plugins with access to the phase registry
 * This maintains separation of concerns while allowing plugins to register phases
 */
class PluginPhaseAdapter {
  /**
   * Register a plugin-provided initialization phase
   * @param phase The phase to register
   * @param pluginId ID of the plugin providing this phase
   * @returns true if the phase was newly registered
   */
  registerPluginPhase(phase: InitPhase, pluginId: string): boolean {
    // Create a plugin-specific phase ID if not provided
    if (!phase.id.includes(":")) {
      phase = {
        ...phase,
        id: `plugin:${pluginId}:${phase.id}`,
      };
    }

    logger.info(`Plugin ${pluginId} is registering phase: ${phase.id}`);
    return phaseRegistry.registerPhase(phase);
  }

  /**
   * Unregister phases provided by a specific plugin
   * @param pluginId ID of the plugin whose phases should be unregistered
   * @returns Number of phases that were unregistered
   */
  unregisterPluginPhases(pluginId: string): number {
    const phases = phaseRegistry.getPhases();
    let count = 0;

    // Find and unregister all phases with the plugin's prefix
    for (const phase of phases) {
      if (phase.id.startsWith(`plugin:${pluginId}:`)) {
        if (phaseRegistry.unregisterPhase(phase.id)) {
          count++;
        }
      }
    }

    if (count > 0) {
      logger.info(`Unregistered ${count} phases from plugin ${pluginId}`);
    }

    return count;
  }

  /**
   * Get all phases that were registered by a specific plugin
   * @param pluginId ID of the plugin
   * @returns Array of phases registered by the plugin
   */
  getPluginPhases(pluginId: string): InitPhase[] {
    return phaseRegistry
      .getPhases()
      .filter((phase: InitPhase) => phase.id.startsWith(`plugin:${pluginId}:`));
  }

  /**
   * Get the phase registry for direct access
   * @returns The phase registry instance
   */
  getPhaseRegistry() {
    return phaseRegistry;
  }
}

// Create and export a singleton instance
export const pluginPhaseAdapter = new PluginPhaseAdapter();
export default pluginPhaseAdapter;
