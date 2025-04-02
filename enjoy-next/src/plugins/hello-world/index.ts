import { BasePlugin } from "../../main/core/base-plugin";
import { PluginContext, PluginManifest } from "../../main/core/plugin-types";
import { dialog } from "electron";

export default class HelloWorldPlugin extends BasePlugin {
  constructor(manifest: PluginManifest, isBuiltIn: boolean) {
    super(manifest, isBuiltIn);
  }

  async activate(): Promise<void> {
    // Call parent activate method
    await super.activate();

    // Register commands
    this.context.registerCommand("showGreeting", () => {
      dialog.showMessageBox({
        type: "info",
        title: "Hello World",
        message: "Hello from the Hello World plugin!",
        buttons: ["OK"],
      });
    });

    // Subscribe to events
    this.context.subscribe("app:ready", () => {
      console.log("Hello World plugin is ready!");
    });
  }

  async deactivate(): Promise<void> {
    // Clean up resources

    // Call parent deactivate method
    await super.deactivate();
  }
}
