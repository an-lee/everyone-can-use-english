/**
 * This file bundles all needed plugin dependencies
 * This helps ensure that dependencies are included in the plugin build
 */
export { PluginLifecycle } from "@main/plugin/plugin.enum";
export { BasePlugin } from "@main/plugin/core/base-plugin";

// Re-export types to make them available to the plugin
export interface IPluginDeps {
  PluginLifecycle: typeof import("@main/plugin/plugin.enum").PluginLifecycle;
  BasePlugin: typeof import("@main/plugin/core/base-plugin").BasePlugin;
}
