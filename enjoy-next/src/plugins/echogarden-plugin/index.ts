/**
 * EchoGarden Plugin for Enjoy
 *
 * This plugin provides access to the EchoGarden API.
 */

import { log } from "@main/core/utils";
import { BasePlugin } from "@main/plugin/core/base-plugin";
import { commands } from "./echogarden";

/**
 * EchoGarden Plugin implementation
 */
export default class EchoGardenPlugin extends BasePlugin {
  private logger = log.scope("echogarden-plugin");
  /**
   * Plugin constructor
   *
   * @param manifest Plugin manifest
   * @param isBuiltIn Whether this is a built-in plugin
   */
  constructor(manifest: PluginManifest, isBuiltIn: boolean) {
    super(manifest, isBuiltIn);
  }

  /**
   * Load the plugin
   * This is called before activate()
   *
   * @param context Plugin context
   */
  async load(context: PluginContext): Promise<void> {
    // Always call parent method first to get context set up
    await super.load(context);

    this.logger.info("EchoGarden plugin loaded");
  }

  /**
   * Activate the plugin
   * This is where you register commands, views, etc.
   */
  async activate(): Promise<void> {
    // Always call parent activate method
    await super.activate();

    // Register commands
    if (this.context) {
      commands.forEach((command) => {
        this.context.registerCommand(command.name, command.function);
      });
    } else {
      this.logger.error("Context not initialized, cannot register commands");
    }

    this.logger.info("EchoGarden plugin activated");
  }

  /**
   * Deactivate the plugin
   * Clean up resources, event listeners, etc.
   */
  async deactivate(): Promise<void> {
    // Clean up resources
    this.logger.info("EchoGarden plugin deactivating");

    // Always call parent deactivate method last
    await super.deactivate();
  }
}
