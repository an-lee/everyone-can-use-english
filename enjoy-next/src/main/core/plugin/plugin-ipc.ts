import { BaseIpcModule } from "@/main/core/ipc/base-ipc-module";
import { IpcMethod } from "@/main/core/ipc/base-ipc-module";
import { IPlugin } from "./types";
import { PluginManager } from "./plugin-manager";

export class PluginIpcModule extends BaseIpcModule {
  constructor() {
    super("Plugin", "plugin");
  }

  /**
   * Get all installed plugins
   * @returns Array of simplified plugin objects for IPC transport
   */
  @IpcMethod()
  async getAll(): Promise<any[]> {
    const { default: pluginManager } = await import("./plugin-manager");
    const plugins = pluginManager.getAllPlugins();

    return plugins.map((plugin) => ({
      id: plugin.id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      description: plugin.manifest.description,
      author: plugin.manifest.author,
      isBuiltIn: plugin.isBuiltIn,
      lifecycle: plugin.lifecycle,
      contributes: plugin.manifest.contributes || {},
    }));
  }

  /**
   * Execute a command registered by a plugin
   * @param _event The IPC event
   * @param commandId The ID of the command to execute
   * @param args Arguments for the command
   * @returns Result of command execution
   */
  @IpcMethod()
  async executeCommand(
    _event: any,
    commandId: string,
    ...args: any[]
  ): Promise<any> {
    this.logger.info(`Executing command: ${commandId}`);

    try {
      const { executeCommand } = await import("./plugin-context");
      return await executeCommand(commandId, ...args);
    } catch (error) {
      this.logger.error(`Error executing command ${commandId}`, error);
      throw error;
    }
  }
}

// Singleton instance
const pluginIpcModule = new PluginIpcModule();

export default pluginIpcModule;
