import { app } from "electron";
import path from "path";
import fs from "fs-extra";
import { log } from "@main/core/utils";
import {
  createPluginContext,
  PluginContextCleanup,
  pluginObservables,
} from "@main/plugin/core";
import { Subscription } from "rxjs";
import { PluginLifecycle } from "@main/plugin/plugin.enum";

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

    // Determine built-in plugins directory based on app packaging status
    if (app.isPackaged) {
      // In production, use the bundled plugins directory
      this.builtInPluginsDir = path.join(
        app.getAppPath(),
        ".vite",
        "build",
        "plugins"
      );
    } else {
      // In development, directly use the transpiled output
      this.builtInPluginsDir = path.join(
        app.getAppPath(),
        ".vite",
        "build",
        "plugins"
      );
    }

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

    try {
      if (!fs.existsSync(this.builtInPluginsDir)) {
        logger.warn(
          `Built-in plugins directory not found: ${this.builtInPluginsDir}`
        );
        return;
      }

      const pluginDirs = fs
        .readdirSync(this.builtInPluginsDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => path.join(this.builtInPluginsDir, dirent.name));

      for (const pluginDir of pluginDirs) {
        await this.loadBuiltInPlugin(pluginDir);
      }
    } catch (error) {
      logger.error("Error loading built-in plugins:", error);
    }
  }

  async loadBuiltInPlugin(pluginDir: string) {
    try {
      const manifestPath = path.join(
        app.getAppPath(),
        "src",
        "plugins",
        path.basename(pluginDir),
        "manifest.json"
      );

      if (!fs.existsSync(manifestPath)) {
        logger.warn(
          `No manifest.json found for built-in plugin at ${manifestPath}`
        );
        return;
      }

      const manifest: PluginManifest = await fs.readJSON(manifestPath);

      if (
        !manifest.id ||
        !manifest.name ||
        !manifest.version ||
        !manifest.main
      ) {
        logger.warn(
          `Invalid manifest.json for built-in plugin ${path.basename(pluginDir)}`
        );
        return;
      }

      if (this.plugins.has(manifest.id)) {
        logger.warn(`Plugin with ID ${manifest.id} already loaded`);
        return;
      }

      // Path to the transpiled JS file
      const pluginMainPath = path.join(pluginDir, "index.js");

      if (!fs.existsSync(pluginMainPath)) {
        logger.warn(`Built-in plugin main file not found: ${pluginMainPath}`);
        return;
      }

      // Dynamic import of the built-in plugin using the transpiled JS
      const pluginModule = await import(`file://${pluginMainPath}`);
      await this.registerPlugin(pluginModule, manifest, true, pluginDir);
    } catch (error) {
      logger.error(`Failed to load built-in plugin from ${pluginDir}`, error);
    }
  }

  async loadUserPlugins() {
    logger.info("Loading user plugins");

    try {
      if (!fs.existsSync(this.pluginsDir)) {
        logger.info(
          `User plugins directory not found, creating: ${this.pluginsDir}`
        );
        fs.ensureDirSync(this.pluginsDir);
        return;
      }

      const pluginDirs = fs
        .readdirSync(this.pluginsDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => path.join(this.pluginsDir, dirent.name));

      for (const pluginDir of pluginDirs) {
        await this.loadUserPlugin(pluginDir);
      }
    } catch (error) {
      logger.error("Error loading user plugins:", error);
    }
  }

  async loadUserPlugin(pluginDir: string) {
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

      // For user plugins, we import directly from the file system
      const pluginModule = await import(`file://${pluginMainPath}`);
      await this.registerPlugin(pluginModule, manifest, false, pluginDir);
    } catch (error) {
      logger.error(`Failed to load user plugin from ${pluginDir}`, error);
    }
  }

  async registerPlugin(
    pluginModule: any,
    manifest: PluginManifest,
    isBuiltIn: boolean,
    pluginDir: string
  ) {
    const pluginExport = pluginModule.default;

    if (!pluginExport) {
      logger.warn(`Plugin ${manifest.id} does not export a default value`);
      return;
    }

    // Handle different plugin export formats
    if (typeof pluginExport === "function") {
      // Handle class-based plugins (from built-in TypeScript)
      if (
        pluginExport.prototype &&
        typeof pluginExport.prototype.activate === "function"
      ) {
        const PluginClass = pluginExport;
        try {
          const pluginInstance = new PluginClass(manifest, isBuiltIn);
          const context = createPluginContext(manifest, isBuiltIn);

          // Store the cleanup handler
          this.contextCleanupHandlers.set(manifest.id, context);

          // Call load method if it exists
          if (typeof pluginInstance.load === "function") {
            await pluginInstance.load(context);
          }

          this.plugins.set(manifest.id, pluginInstance);

          // Emit plugin loaded event
          pluginObservables.emitPluginLoaded(manifest.id, pluginDir, manifest);

          logger.info(
            `Loaded class-based plugin: ${manifest.name} (${manifest.id}) v${manifest.version}`
          );
        } catch (error) {
          logger.error(
            `Failed to instantiate plugin class for ${manifest.id}:`,
            error
          );
        }
      } else {
        // Handle function-based plugins (factory function pattern)
        try {
          const pluginInstance = pluginExport(manifest, isBuiltIn);
          if (pluginInstance && typeof pluginInstance.activate === "function") {
            const context = createPluginContext(manifest, isBuiltIn);

            // Store the cleanup handler
            this.contextCleanupHandlers.set(manifest.id, context);

            // Create the plugin entry with context injected
            const plugin: PluginInternal = {
              ...pluginInstance,
              id: manifest.id,
              manifest,
              isBuiltIn,
              lifecycle: PluginLifecycle.LOADED,

              // Ensure these functions are bound to the plugin instance
              activate: () => pluginInstance.activate(context),
              deactivate: () =>
                pluginInstance.deactivate?.() || Promise.resolve(),
            };

            this.plugins.set(manifest.id, plugin);

            // Emit plugin loaded event
            pluginObservables.emitPluginLoaded(
              manifest.id,
              pluginDir,
              manifest
            );

            logger.info(
              `Loaded factory function plugin: ${manifest.name} (${manifest.id}) v${manifest.version}`
            );
          } else {
            logger.warn(
              `Factory function for plugin ${manifest.id} doesn't return a valid plugin object`
            );
          }
        } catch (error) {
          logger.error(
            `Failed to execute factory function for plugin ${manifest.id}:`,
            error
          );
        }
      }
    } else if (typeof pluginExport === "object") {
      // Handle object-based plugins (simple object with activate method)
      if (typeof pluginExport.activate === "function") {
        try {
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
                logger.error(
                  `Failed to activate plugin ${manifest.id}:`,
                  error
                );
                this.lifecycle = PluginLifecycle.ERROR;
                throw error;
              }
            },

            async deactivate(): Promise<void> {
              try {
                // Call the plugin's deactivate function if available
                if (this.cleanupFunc) {
                  await this.cleanupFunc();
                } else if (typeof pluginExport.deactivate === "function") {
                  await pluginExport.deactivate();
                }

                // Emit plugin deactivated event - this will trigger cleanup
                pluginObservables.emitPluginDeactivated(manifest.id);

                this.lifecycle = PluginLifecycle.LOADED;
              } catch (error) {
                logger.error(
                  `Failed to deactivate plugin ${manifest.id}:`,
                  error
                );
                this.lifecycle = PluginLifecycle.ERROR;
                throw error;
              }
            },

            getConfig<T>(key: string): T | undefined {
              // Implement config access
              return pluginExport.getConfig?.(key) as T | undefined;
            },

            setConfig<T>(key: string, value: T): void {
              // Implement config setting
              pluginExport.setConfig?.(key, value);
            },
          };

          this.plugins.set(manifest.id, plugin);

          // Emit plugin loaded event
          pluginObservables.emitPluginLoaded(manifest.id, pluginDir, manifest);

          logger.info(
            `Loaded object-based plugin: ${manifest.name} (${manifest.id}) v${manifest.version}`
          );
        } catch (error) {
          logger.error(
            `Failed to initialize object-based plugin ${manifest.id}:`,
            error
          );
        }
      } else {
        logger.warn(`Plugin ${manifest.id} does not have an activate function`);
      }
    } else {
      logger.warn(
        `Plugin ${manifest.id} has an unsupported export type: ${typeof pluginExport}`
      );
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

  async loadPlugin(pluginDir: string, isBuiltIn: boolean) {
    // This method is kept for backward compatibility
    if (isBuiltIn) {
      await this.loadBuiltInPlugin(pluginDir);
    } else {
      await this.loadUserPlugin(pluginDir);
    }
  }
}

export default new PluginManager();
