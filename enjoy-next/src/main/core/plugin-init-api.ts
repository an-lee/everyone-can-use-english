import log from "@main/services/logger";
import { phaseRegistry, InitPhase } from "./phase-registry";

const logger = log.scope("PluginInitAPI");

/**
 * API for plugins to interact with the initialization system
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

    return phaseRegistry.registerPhase(fullPhase);
  },

  /**
   * Unregister a plugin's initialization phase
   * @param pluginId The ID of the plugin
   * @param phaseName The name of the phase to unregister
   * @returns True if the phase was found and unregistered
   */
  unregisterPhase: (pluginId: string, phaseName: string): boolean => {
    const phaseId = `plugin:${pluginId}:${phaseName.toLowerCase().replace(/\s+/g, "_")}`;
    logger.info(`Plugin ${pluginId} is unregistering phase: ${phaseName}`);
    return phaseRegistry.unregisterPhase(phaseId);
  },

  /**
   * Get all currently registered phases
   * @returns Array of phase information
   */
  getPhases: (): Array<{
    id: string;
    name: string;
    dependencies: string[];
  }> => {
    return phaseRegistry.getPhases().map((p) => ({
      id: p.id,
      name: p.name,
      dependencies: p.dependencies,
    }));
  },
};

export default PluginInitAPI;
