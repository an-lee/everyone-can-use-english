import { BasePlugin } from "@main/plugin/core/base-plugin";
import { dialog } from "electron";

export default class FFmpegPlugin extends BasePlugin {
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
        title: "FFmpeg",
        message: "FFmpeg plugin is ready!",
        buttons: ["OK"],
      });
    });

    // Subscribe to events
    this.context.subscribe("app:ready", () => {
      console.log("FFmpeg plugin is ready!");
    });
  }

  async deactivate(): Promise<void> {
    // Clean up resources

    // Call parent deactivate method
    await super.deactivate();
  }
}
