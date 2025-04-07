import { BaseIpcModule, IpcMethod } from "@/main/ipc/modules/base-ipc-module";
import pluginManager from "@/main/plugin/manager/plugin-manager";

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
    return pluginManager.getAllPlugins();
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
    return pluginManager.getPlugin(pluginId);
  }
}

// Singleton instance
export const pluginIpcModule = new PluginIpcModule();
