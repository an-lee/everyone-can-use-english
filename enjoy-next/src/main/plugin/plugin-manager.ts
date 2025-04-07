import { app } from "electron";
import path from "path";
import fs from "fs-extra";
import { IPlugin, PluginLifecycle, PluginManifest } from "@main/plugin/types";
import log from "@main/core/utils/logger";
import { pluginObservables } from "./plugin-observables";
import { createPluginContext, PluginContextCleanup } from "./plugin-context";
import { Subscription } from "rxjs";

const logger = log.scope("plugin-manager");

// Extended plugin interface for internal use
interface PluginInternal extends IPlugin {
  // Function to clean up resources provided by the plugin itself
  cleanupFunc?: () => Promise<void>;
}

export class PluginManager {
  private plugins: Map<string, PluginInternal> = new Map();
  private pluginsDir: string;
  private builtInPluginsDir: string;
  private contextCleanupHandlers: Map<string, PluginContextCleanup> = new Map();
  private subscriptions: Subscription[] = [];

  constructor() {
    this.pluginsDir = path.join(app.getPath("userData"), "plugins");
    this.builtInPluginsDir = path.join(app.getAppPath(), "src", "plugins");

    // Ensure the plugins directory exists
    fs.ensureDirSync(this.pluginsDir);
  }

  async init() {
    logger.info("Initializing plugin manager");

    // Subscribe to plugin event streams
    this.setupEventSubscriptions();

    // Load plugins
    await this.loadBuiltInPlugins();
    await this.loadUserPlugins();
  }

  private setupEventSubscriptions() {
    // Subscribe to plugin deactivation events
    const deactivatedSub = pluginObservables.pluginDeactivated$.subscribe(
      (event) => {
        // Clean up any resources associated with the plugin
        const cleanup = this.contextCleanupHandlers.get(event.pluginId);
        if (cleanup) {
          try {
            cleanup.cleanup();
            this.contextCleanupHandlers.delete(event.pluginId);
            logger.debug(`Cleaned up resources for plugin ${event.pluginId}`);
          } catch (error) {
            logger.error(`Error cleaning up plugin ${event.pluginId}:`, error);
          }
        }
      }
    );

    this.subscriptions.push(deactivatedSub);
  }

  async loadBuiltInPlugins() {
    logger.info("Loading built-in plugins");
    if (!fs.existsSync(this.builtInPluginsDir)) return;

    const pluginDirs = fs
      .readdirSync(this.builtInPluginsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => path.join(this.builtInPluginsDir, dirent.name));

    for (const pluginDir of pluginDirs) {
      await this.loadPlugin(pluginDir, true);
    }
  }

  async loadUserPlugins() {
    logger.info("Loading user plugins");
    if (!fs.existsSync(this.pluginsDir)) return;

    const pluginDirs = fs
      .readdirSync(this.pluginsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => path.join(this.pluginsDir, dirent.name));

    for (const pluginDir of pluginDirs) {
      await this.loadPlugin(pluginDir, false);
    }
  }

  async loadPlugin(pluginDir: string, isBuiltIn: boolean) {
    try {
      const manifestPath = path.join(pluginDir, "manifest.json");

      if (!fs.existsSync(manifestPath)) {
        logger.warn(`No manifest.json found in ${pluginDir}`);
        return;
      }

      const manifest: PluginManifest = await fs.readJSON(manifestPath);

      if (
        !manifest.id ||
        !manifest.name ||
        !manifest.version ||
        !manifest.main
      ) {
        logger.warn(`Invalid manifest.json in ${pluginDir}`);
        return;
      }

      if (this.plugins.has(manifest.id)) {
        logger.warn(`Plugin with ID ${manifest.id} already loaded`);
        return;
      }

      const pluginMainPath = path.join(pluginDir, manifest.main);
      if (!fs.existsSync(pluginMainPath)) {
        logger.warn(`Plugin main file not found: ${pluginMainPath}`);
        return;
      }

      // Dynamic import of the plugin
      const pluginModule = await import(pluginMainPath);
      const pluginExport = pluginModule.default;

      if (!pluginExport || typeof pluginExport.activate !== "function") {
        logger.warn(
          `Plugin ${manifest.id} does not export an activate function`
        );
        return;
      }

      // Create the plugin context
      const context = createPluginContext(manifest, isBuiltIn);

      // Store the cleanup handler
      this.contextCleanupHandlers.set(manifest.id, context);

      // Create the plugin entry
      const plugin: PluginInternal = {
        id: manifest.id,
        manifest,
        isBuiltIn,
        lifecycle: PluginLifecycle.LOADED,

        async activate(): Promise<void> {
          try {
            this.lifecycle = PluginLifecycle.ACTIVE;

            // Call the plugin's activate function
            const result = await pluginExport.activate(context);

            // Store cleanup function if returned by plugin
            if (result && typeof result.deactivate === "function") {
              this.cleanupFunc = result.deactivate;
            }

            // Emit plugin activated event
            pluginObservables.emitPluginActivated(manifest.id);
          } catch (error) {
            logger.error(`Failed to activate plugin ${manifest.id}:`, error);
            this.lifecycle = PluginLifecycle.ERROR;
            throw error;
          }
        },

        async deactivate(): Promise<void> {
          try {
            // Call the plugin's deactivate function if available
            if (this.cleanupFunc) {
              await this.cleanupFunc();
            }

            // Emit plugin deactivated event - this will trigger cleanup
            pluginObservables.emitPluginDeactivated(manifest.id);

            this.lifecycle = PluginLifecycle.LOADED;
          } catch (error) {
            logger.error(`Failed to deactivate plugin ${manifest.id}:`, error);
            this.lifecycle = PluginLifecycle.ERROR;
            throw error;
          }
        },

        getConfig<T>(key: string): T | undefined {
          // Simple implementation - would need proper storage
          return undefined;
        },

        setConfig<T>(key: string, value: T): void {
          // Simple implementation - would need proper storage
        },
      };

      this.plugins.set(manifest.id, plugin);

      // Emit plugin loaded event
      pluginObservables.emitPluginLoaded(manifest.id, pluginDir, manifest);

      logger.info(
        `Loaded plugin: ${manifest.name} (${manifest.id}) v${manifest.version}`
      );
    } catch (error) {
      logger.error(`Failed to load plugin from ${pluginDir}`, error);
    }
  }

  async activatePlugins() {
    logger.info("Activating plugins");

    for (const [id, plugin] of this.plugins.entries()) {
      try {
        if (plugin.lifecycle === PluginLifecycle.LOADED) {
          await plugin.activate();
          logger.info(`Activated plugin: ${id}`);
        }
      } catch (error) {
        logger.error(`Failed to activate plugin: ${id}`, error);
      }
    }
  }

  async deactivatePlugins() {
    logger.info("Deactivating plugins");

    for (const [id, plugin] of this.plugins.entries()) {
      try {
        if (plugin.lifecycle === PluginLifecycle.ACTIVE) {
          await plugin.deactivate();
          logger.info(`Deactivated plugin: ${id}`);
        }
      } catch (error) {
        logger.error(`Failed to deactivate plugin: ${id}`, error);
      }
    }
  }

  getPlugin(id: string): IPlugin | undefined {
    return this.plugins.get(id);
  }

  getAllPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Clean up all resources when application is shutting down
   */
  cleanup() {
    // Unsubscribe from all observables
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

    // Clean up all plugin contexts
    this.contextCleanupHandlers.forEach((cleanup) => {
      try {
        cleanup.cleanup();
      } catch (error) {
        logger.error("Error during plugin cleanup:", error);
      }
    });
    this.contextCleanupHandlers.clear();

    logger.info("Plugin manager cleaned up successfully");
  }
}

export default new PluginManager();
