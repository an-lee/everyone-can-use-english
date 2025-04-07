import { phaseRegistry } from "@main/core/initializer/phase-registry";
import ipcSetupPhase from "@main/core/initializer/phases/ipc-setup-phase";
import dbInitPhase from "@main/core/initializer/phases/db-init-phase";
import log from "@/main/core/utils/logger";

const logger = log.scope("InitializerPhases");

/**
 * Register all application initialization phases
 */
export function registerInitializerPhases(): void {
  logger.info("Registering application initialization phases");

  // Register core system phases
  phaseRegistry.registerPhase(ipcSetupPhase);
  phaseRegistry.registerPhase(dbInitPhase);

  // Future: add config, plugins, UI, etc.

  logger.info(
    `Registered ${phaseRegistry.getPhases().length} initialization phases`
  );
}

// Export singleton for easy access
export default { registerInitializerPhases };
