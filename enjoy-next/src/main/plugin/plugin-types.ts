/**
 * Plugin system runtime types
 * This file contains runtime definitions of the types used by the plugin system
 * These are exported as actual values that can be used at runtime, not just types
 */

// Plugin lifecycle states
export enum PluginLifecycle {
  UNLOADED = "unloaded",
  LOADED = "loaded",
  ACTIVE = "active",
  ERROR = "error",
}

// Plugin initialization hook types
export enum InitHookType {
  BEFORE_PHASE = "beforePhase",
  AFTER_PHASE = "afterPhase",
  ON_TIMEOUT = "onTimeout",
  ON_ERROR = "onError",
}

// Export types as a namespace for plugins to use
export const PluginTypes = {
  PluginLifecycle,
  InitHookType,
};

export default PluginTypes;
