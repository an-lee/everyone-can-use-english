import { app } from "electron";
import path from "path";
import fs from "fs-extra";
import {
  IPlugin,
  PluginLifecycle,
  PluginManifest,
  PluginContext,
} from "@main/plugin/types";
import log from "@main/core/utils/logger";

const logger = log.scope("base-plugin");

export abstract class BasePlugin implements IPlugin {
  public id: string;
  public manifest: PluginManifest;
  public isBuiltIn: boolean;
  public lifecycle: PluginLifecycle;

  protected context!: PluginContext;
  private configPath: string;
  private config: Record<string, any> = {};

  constructor(manifest: PluginManifest, isBuiltIn: boolean) {
    this.id = manifest.id;
    this.manifest = manifest;
    this.isBuiltIn = isBuiltIn;
    this.lifecycle = PluginLifecycle.UNLOADED;

    // Set up config storage
    this.configPath = path.join(
      app.getPath("userData"),
      "plugin-data",
      manifest.id,
      "config.json"
    );

    // Load config on construction
    this.loadConfig();
  }

  /**
   * Load plugin configuration from disk
   */
  private loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        this.config = fs.readJSONSync(this.configPath);
        logger.debug(`Loaded config for plugin ${this.id}`);
      }
    } catch (error) {
      logger.error(`Failed to load config for plugin ${this.id}`, error);
    }
  }

  /**
   * Save plugin configuration to disk
   */
  private saveConfig() {
    try {
      fs.ensureDirSync(path.dirname(this.configPath));
      fs.writeJSONSync(this.configPath, this.config, { spaces: 2 });
      logger.debug(`Saved config for plugin ${this.id}`);
    } catch (error) {
      logger.error(`Failed to save config for plugin ${this.id}`, error);
    }
  }

  /**
   * Get a configuration value
   */
  public getConfig<T>(key: string): T | undefined {
    return this.config[key] as T;
  }

  /**
   * Set a configuration value and save to disk
   */
  public setConfig<T>(key: string, value: T): void {
    this.config[key] = value;
    this.saveConfig();
  }

  /**
   * Called when the plugin is being loaded
   * This is where you should set up your plugin
   */
  public async load(context: PluginContext): Promise<void> {
    this.context = context;
    this.lifecycle = PluginLifecycle.LOADED;
    logger.info(`Loaded plugin ${this.id}`);
  }

  /**
   * Called when the plugin is being activated
   * This is where you should register commands, views, etc.
   */
  public async activate(): Promise<void> {
    this.lifecycle = PluginLifecycle.ACTIVE;
    logger.info(`Activated plugin ${this.id}`);
  }

  /**
   * Called when the plugin is being deactivated
   * This is where you should clean up resources
   */
  public async deactivate(): Promise<void> {
    this.lifecycle = PluginLifecycle.LOADED;
    logger.info(`Deactivated plugin ${this.id}`);
  }
}
