import { app } from "electron";
import path from "path";
import fs from "fs-extra";
import { IPlugin, PluginLifecycle, PluginManifest } from "@/types/plugin.d";
import log from "@main/services/logger";

const logger = log.scope("plugin-manager");

export class PluginManager {
  private plugins: Map<string, IPlugin> = new Map();
  private pluginsDir: string;
  private builtInPluginsDir: string;

  constructor() {
    this.pluginsDir = path.join(app.getPath("userData"), "plugins");
    this.builtInPluginsDir = path.join(app.getAppPath(), "src", "plugins");

    // Ensure the plugins directory exists
    fs.ensureDirSync(this.pluginsDir);
  }

  async init() {
    logger.info("Initializing plugin manager");
    await this.loadBuiltInPlugins();
    await this.loadUserPlugins();
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

      if (!pluginExport || typeof pluginExport !== "function") {
        logger.warn(`Plugin ${manifest.id} does not export a constructor`);
        return;
      }

      const plugin: IPlugin = new pluginExport(manifest, isBuiltIn);
      this.plugins.set(manifest.id, plugin);

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
}

export default new PluginManager();
