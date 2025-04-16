import { executeCommand } from "@main/plugin/core";
import { BaseIpcModule, IpcMethod } from "@main/ipc/modules/base-ipc-module";
import pluginManager from "@main/plugin/manager/plugin-manager";

export class PluginIpcModule extends BaseIpcModule {
  constructor() {
    super("PluginModule", "plugin");
  }

  @IpcMethod({
    description: "Gets all available plugins",
    returns: {
      type: "any[]",
      description: "Array of plugin metadata",
    },
  })
  async getAll(): Promise<any[]> {
    const plugins = pluginManager.getAllPlugins();
    this.logger.debug(`All plugins: ${JSON.stringify(plugins)}`);
    return plugins.map((plugin) => ({
      id: plugin.id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
    }));
  }

  @IpcMethod({
    description: "Gets a plugin by ID",
    parameters: [
      {
        name: "pluginId",
        type: "string",
        description: "Plugin ID",
        required: true,
      },
    ],
    returns: {
      type: "any",
      description: "Plugin details",
    },
  })
  async get(_event: any, pluginId: string): Promise<any> {
    const plugin = pluginManager.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }
    this.logger.debug(`Plugin details: ${JSON.stringify(plugin)}`);

    return {
      id: plugin.id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      description: plugin.manifest.description,
      author: plugin.manifest.author,
      isBuiltIn: plugin.isBuiltIn,
    };
  }

  @IpcMethod({
    description: "Activates a plugin",
    parameters: [
      {
        name: "pluginId",
        type: "string",
        description: "Plugin ID",
        required: true,
      },
    ],
  })
  async activate(_event: any, pluginId: string): Promise<void> {
    const plugin = pluginManager.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }
    await plugin.activate();
    this.logger.debug(`Plugin activated: ${pluginId}`);
  }

  @IpcMethod({
    description: "Deactivates a plugin",
    parameters: [
      {
        name: "pluginId",
        type: "string",
        description: "Plugin ID",
        required: true,
      },
    ],
  })
  async deactivate(_event: any, pluginId: string): Promise<void> {
    const plugin = pluginManager.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }
    await plugin.deactivate();
    this.logger.debug(`Plugin deactivated: ${pluginId}`);
  }

  @IpcMethod({
    description: "Reloads a plugin",
    parameters: [
      {
        name: "pluginId",
        type: "string",
        description: "Plugin ID",
        required: true,
      },
    ],
  })
  async reload(_event: any, pluginId: string): Promise<void> {
    const plugin = pluginManager.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }
    await plugin.deactivate();
    await plugin.activate();
  }

  @IpcMethod({
    description: "Executes a command for a plugin",
    parameters: [
      {
        name: "pluginId",
        type: "string",
        description: "Plugin ID",
        required: true,
      },
      {
        name: "commandId",
        type: "string",
        description: "Command ID",
        required: true,
      },
      {
        name: "args",
        type: "any[]",
        description: "Command arguments",
        required: false,
      },
    ],
    returns: {
      type: "any",
      description: "Command result",
    },
  })
  async executeCommand(
    _event: any,
    pluginId: string,
    commandId: string,
    args?: any[]
  ): Promise<any> {
    try {
      const result = await executeCommand(
        `${pluginId}.${commandId}`,
        ...(args || [])
      );
      this.logger.debug(
        `Command executed: ${commandId} with result: ${result}`
      );
      return result;
    } catch (error) {
      this.logger.error(`Error executing command: ${commandId}`, error);
      throw error;
    }
  }
}

// Singleton instance
export const pluginIpcModule = new PluginIpcModule();
