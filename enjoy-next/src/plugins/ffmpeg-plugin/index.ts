import { dialog } from "electron";
import { log } from "@main/core/utils";
import { BasePlugin, PluginLifecycle } from "./plugin-deps";

// No need to define the enum locally as we're importing it now

export default class FFmpegPlugin extends BasePlugin {
  constructor(manifest: PluginManifest, isBuiltIn: boolean) {
    super(manifest, isBuiltIn);
  }

  async load(context: PluginContext): Promise<void> {
    // Call parent method first to get context set up
    await super.load(context);

    log.scope("ffmpeg-plugin").info("FFmpeg plugin loaded");
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

    log.scope("ffmpeg-plugin").info("FFmpeg plugin activated");
  }

  async deactivate(): Promise<void> {
    // Clean up resources
    log.scope("ffmpeg-plugin").info("FFmpeg plugin deactivating");

    // Call parent deactivate method
    await super.deactivate();
  }
}
