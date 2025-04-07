import { PluginContext } from "@/types/plugin";

export const activate = async (context: PluginContext) => {
  console.log("Example plugin activated");

  // Register a custom initialization phase
  context.registerInitPhase({
    name: "Example Plugin Setup",
    description: "Preparing example plugin resources",
    // This phase depends on the core database being ready
    dependencies: ["database"],
    execute: async () => {
      console.log("Example plugin initialization phase running");
      // Example: Load plugin resources, connect to services, etc.

      // Simulate some async work
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("Example plugin initialization complete");
    },
  });

  // Register a command that lists all initialization phases
  context.registerCommand("listInitPhases", () => {
    const phases = context.getInitPhases();
    console.log("Current initialization phases:");
    phases.forEach((phase) => {
      console.log(`- ${phase.name} (${phase.id})`);
      console.log(`  Dependencies: ${phase.dependencies.join(", ") || "none"}`);
    });
    return phases;
  });

  // Clean up when deactivated
  return {
    deactivate: () => {
      // Unregister our initialization phase when plugin is deactivated
      context.unregisterInitPhase("Example Plugin Setup");
      console.log("Example plugin deactivated");
    },
  };
};
