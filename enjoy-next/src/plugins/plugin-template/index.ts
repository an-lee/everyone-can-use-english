/**
 * Template Plugin for Enjoy
 *
 * This is a template for creating built-in plugins.
 * Use this as a starting point for your own plugins.
 */

import { dialog } from "electron";
import { log } from "@main/core/utils";
import { BasePlugin } from "@main/plugin/core/base-plugin";
import { PluginLifecycle } from "@main/plugin/plugin.enum";

// Create a scoped logger for this plugin
const logger = log.scope("plugin-template");

/**
 * Template Plugin implementation
 */
export default class TemplatePlugin extends BasePlugin {
  /**
   * Plugin constructor
   *
   * @param manifest Plugin manifest
   * @param isBuiltIn Whether this is a built-in plugin
   */
  constructor(manifest: PluginManifest, isBuiltIn: boolean) {
    super(manifest, isBuiltIn);
    logger.info("Template plugin constructed");
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

    // Do initialization that doesn't require activation
    logger.info("Template plugin loaded");
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
      this.context.registerCommand("templateCommand", () => {
        dialog.showMessageBox({
          type: "info",
          title: "Template Plugin",
          message: "This is a template plugin command!",
          buttons: ["OK"],
        });

        logger.info("Template command executed");
      });

      // Subscribe to events
      this.context.subscribe("app:ready", () => {
        logger.info("Application is ready - template plugin");
      });
    } else {
      logger.error("Context not initialized, cannot register commands");
    }

    logger.info("Template plugin activated");
  }

  /**
   * Deactivate the plugin
   * Clean up resources, event listeners, etc.
   */
  async deactivate(): Promise<void> {
    // Clean up resources
    logger.info("Template plugin deactivating");

    // Always call parent deactivate method last
    await super.deactivate();
  }
}
