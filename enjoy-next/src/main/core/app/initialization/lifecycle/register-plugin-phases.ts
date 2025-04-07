import { phaseRegistry } from "@/main/core/app/initialization/registry/phase-registry";
import pluginManager from "@main/plugin/plugin-manager";
import { publishEvent } from "@main/plugin/plugin-context";
import log from "@/main/core/utils/logger";

const logger = log.scope("RegisterPluginPhases");

/**
 * Register all plugin system phases
 */
export function registerPluginSystemPhases(): void {
  logger.info("Registering plugin system phases");

  // Register phases that depend on the plugin system
  phaseRegistry.registerPluginSystemPhases(pluginManager, publishEvent);

  logger.info(
    `Plugin system phases registered. Total phases: ${phaseRegistry.getPhases().length}`
  );
}

// Export singleton for easy access
export default { registerPluginSystemPhases };
