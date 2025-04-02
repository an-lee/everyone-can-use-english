import { app } from "electron";
import path from "path";
import fs from "fs-extra";
import { PluginContext, PluginManifest } from "./plugin-types";
import log from "../services/logger";
import { EventEmitter } from "events";

const logger = log.scope("plugin-context");
const eventBus = new EventEmitter();

// Set max listeners to higher value to support many plugins
eventBus.setMaxListeners(100);

/**
 * Create a plugin context for a specific plugin
 */
export function createPluginContext(
  manifest: PluginManifest,
  isBuiltIn: boolean
): PluginContext {
  const pluginId = manifest.id;
  const pluginLogger = log.scope(`plugin:${pluginId}`);

  // Determine storage path for the plugin
  const storagePath = isBuiltIn
    ? path.join(app.getPath("userData"), "plugin-data", pluginId)
    : path.join(app.getPath("userData"), "plugins", pluginId, "data");

  // Ensure the storage directory exists
  fs.ensureDirSync(storagePath);

  // Map of registered commands
  const commands = new Map<string, (...args: any[]) => any>();

  // Map of registered views
  const views = new Map<string, any>();

  // Services available to plugins
  const services: Record<string, any> = {};

  // Create and return the plugin context
  const context: PluginContext = {
    registerCommand(id: string, callback: (...args: any[]) => any): void {
      const commandId = `${pluginId}.${id}`;
      if (commands.has(commandId)) {
        pluginLogger.warn(`Command ${commandId} is already registered`);
        return;
      }

      commands.set(commandId, callback);
      pluginLogger.debug(`Registered command: ${commandId}`);

      // Publish command registration event
      eventBus.emit("command:registered", {
        id: commandId,
        pluginId,
        title: id,
        // Find command definition from manifest if available
        ...(manifest.contributes?.commands?.find((cmd) => cmd.id === id) || {}),
      });
    },

    registerView(id: string, component: any): void {
      const viewId = `${pluginId}.${id}`;
      if (views.has(viewId)) {
        pluginLogger.warn(`View ${viewId} is already registered`);
        return;
      }

      views.set(viewId, component);
      pluginLogger.debug(`Registered view: ${viewId}`);

      // Publish view registration event
      eventBus.emit("view:registered", {
        id: viewId,
        pluginId,
        // Find view definition from manifest if available
        ...(manifest.contributes?.views?.sidebar?.find((v) => v.id === id) ||
          manifest.contributes?.views?.panel?.find((v) => v.id === id) ||
          {}),
      });
    },

    subscribe(event: string, callback: (...args: any[]) => any): void {
      eventBus.on(event, callback);
      pluginLogger.debug(`Subscribed to event: ${event}`);
    },

    publish(event: string, ...args: any[]): void {
      eventBus.emit(event, ...args);
      pluginLogger.debug(`Published event: ${event}`);
    },

    getStoragePath(): string {
      return storagePath;
    },

    getService<T>(name: string): T | undefined {
      return services[name] as T | undefined;
    },
  };

  return context;
}

/**
 * Execute a command by ID
 */
export function executeCommand(commandId: string, ...args: any[]): any {
  const parts = commandId.split(".");
  if (parts.length !== 2) {
    logger.warn(`Invalid command ID: ${commandId}`);
    return;
  }

  // Find all commands
  const allCommands = Array.from(getCommands().entries());

  // Look for the command
  const command = allCommands.find(([id]) => id === commandId);

  if (!command) {
    logger.warn(`Command not found: ${commandId}`);
    return;
  }

  try {
    return command[1](...args);
  } catch (error) {
    logger.error(`Error executing command ${commandId}`, error);
  }
}

/**
 * Get all registered commands
 */
export function getCommands(): Map<string, (...args: any[]) => any> {
  const result = new Map<string, (...args: any[]) => any>();

  // Get commands from all plugins
  // This would need to be updated to gather commands from all plugins
  // For now, returning an empty map

  return result;
}

/**
 * Register a global service
 */
export function registerService(name: string, service: any): void {
  logger.info(`Registering service: ${name}`);

  // Store service for plugins to use
  // This implementation is simplified and would need to be expanded
}

/**
 * Subscribe to global events
 */
export function subscribeToEvent(
  event: string,
  callback: (...args: any[]) => any
): void {
  eventBus.on(event, callback);
}

/**
 * Publish a global event
 */
export const publishEvent = (eventName: string, data?: any) => {
  console.log(`Publishing event: ${eventName}`, data || "");
};
