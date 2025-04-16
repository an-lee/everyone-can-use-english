import log from "@main/core/utils/logger";
import appConfig from "@main/core/app/config";
import db from "@main/storage";

// Configure logger
const logger = log.scope("PhaseRegistry");

/**
 * Registry for initialization phases
 * Manages registration, dependencies, and provides access to phases
 */
class PhaseRegistry {
  private phases: InitPhase[] = [];

  constructor() {}

  /**
   * Register a new initialization phase
   * @param phase The phase to register
   * @returns true if the phase was newly registered, false if it replaced an existing phase
   */
  registerPhase(phase: InitPhase): boolean {
    // Validate phase
    if (!phase.id || !phase.name || !phase.description) {
      logger.warn(`Invalid phase definition: ${JSON.stringify(phase)}`);
      return false;
    }

    // Check for circular dependencies
    if (phase.dependencies.includes(phase.id)) {
      logger.error(
        `Phase "${phase.id}" depends on itself, creating a circular dependency`
      );
      return false;
    }

    // Check if phase with same id already exists
    const existingIndex = this.phases.findIndex((p) => p.id === phase.id);
    if (existingIndex >= 0) {
      logger.info(`Replacing existing phase "${phase.id}"`);
      this.phases[existingIndex] = phase;
      return false; // Not a new phase
    } else {
      logger.info(`Registering new phase "${phase.id}"`);
      this.phases.push(phase);
      return true; // New phase
    }
  }

  /**
   * Unregister a phase by ID
   * @param phaseId The ID of the phase to unregister
   * @returns true if the phase was found and unregistered, false otherwise
   */
  unregisterPhase(phaseId: string): boolean {
    const initialLength = this.phases.length;
    this.phases = this.phases.filter((p) => p.id !== phaseId);
    return this.phases.length < initialLength;
  }

  /**
   * Get all registered phases
   * @returns A copy of the phases array
   */
  getPhases(): InitPhase[] {
    return [...this.phases];
  }

  /**
   * Get a specific phase by ID
   * @param phaseId The ID of the phase to get
   * @returns The phase or undefined if not found
   */
  getPhase(phaseId: string): InitPhase | undefined {
    return this.phases.find((p) => p.id === phaseId);
  }

  /**
   * Check if a phase exists
   * @param phaseId The ID of the phase to check
   * @returns true if the phase exists, false otherwise
   */
  hasPhase(phaseId: string): boolean {
    return this.phases.some((p) => p.id === phaseId);
  }

  /**
   * Check if a dependency cycle exists in the registered phases
   * @returns Array of phase IDs involved in cycles, or empty array if no cycles
   */
  detectCycles(): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycleNodes = new Set<string>();

    // DFS to detect cycles
    const dfs = (phaseId: string): boolean => {
      if (recursionStack.has(phaseId)) {
        cycleNodes.add(phaseId);
        return true;
      }

      if (visited.has(phaseId)) return false;

      visited.add(phaseId);
      recursionStack.add(phaseId);

      const phase = this.getPhase(phaseId);
      if (phase) {
        for (const depId of phase.dependencies) {
          if (dfs(depId)) {
            cycleNodes.add(phaseId);
            return true;
          }
        }
      }

      recursionStack.delete(phaseId);
      return false;
    };

    // Check each phase for cycles
    for (const phase of this.phases) {
      if (!visited.has(phase.id)) {
        dfs(phase.id);
      }
    }

    return Array.from(cycleNodes);
  }

  /**
   * Register default system phases
   * This should be called during core initialization
   */
  registerDefaultPhases(): void {
    logger.info("Registering default initialization phases");

    // Configuration phase - loads app configuration
    this.registerPhase({
      id: "config",
      name: "Configuration",
      description: "Loading application configuration",
      dependencies: [],
      execute: async () => {
        await appConfig.initialize();
      },
    });

    // Database initialization
    this.registerPhase({
      id: "database",
      name: "Database",
      description: "Setting up database connection",
      dependencies: ["config"],
      execute: async () => {
        db.init();
        // Database actual connection happens when user logs in
      },
    });

    // Plugin system phases will be registered by the plugin manager when it loads
    // But they depend on these core phases, so we define them here

    logger.info(
      `Registered ${this.phases.length} default initialization phases`
    );
  }

  /**
   * Register plugin system phases
   * @param pluginManager The plugin manager instance
   * @param publishEvent The function to publish events
   */
  registerPluginSystemPhases(
    pluginManager: any,
    publishEvent: (event: string, data?: any) => void
  ): void {
    logger.info("Registering plugin system phases");

    // Plugin system initialization
    this.registerPhase({
      id: "plugin_system",
      name: "Plugin System",
      description: "Initializing plugin system",
      dependencies: ["config"],
      execute: async () => {
        await pluginManager.init();
      },
    });

    // Plugin activation
    this.registerPhase({
      id: "plugins_activation",
      name: "Plugins Activation",
      description: "Activating plugins",
      dependencies: ["plugin_system"],
      execute: async () => {
        await pluginManager.activatePlugins();
      },
    });

    // Final ready phase
    this.registerPhase({
      id: "app_ready",
      name: "Application Ready",
      description: "Publishing application ready event",
      dependencies: ["plugin_system", "plugins_activation", "database"],
      execute: async () => {
        publishEvent("app:ready");
      },
    });

    logger.info(
      `Registered plugin system phases, total phases: ${this.phases.length}`
    );
  }
}

// Create and export a singleton instance
export const phaseRegistry = new PhaseRegistry();
export default phaseRegistry;
