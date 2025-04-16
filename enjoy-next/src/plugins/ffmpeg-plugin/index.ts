import { dialog } from "electron";
import { log } from "@main/core/utils";
import { BasePlugin } from "@main/plugin/core/base-plugin";
import { Ffmpeg } from "./ffmpeg";

// No need to define the enum locally as we're importing it now

export default class FFmpegPlugin extends BasePlugin {
  protected logger = log.scope("ffmpeg-plugin");

  constructor(manifest: PluginManifest, isBuiltIn: boolean) {
    super(manifest, isBuiltIn);
  }

  async load(context: PluginContext): Promise<void> {
    // Call parent method first to get context set up
    await super.load(context);

    this.logger.info("FFmpeg plugin loaded");
  }

  async activate(): Promise<void> {
    // Call parent activate method
    await super.activate();

    const ffmpeg = new Ffmpeg();
    // Register commands
    this.context.registerCommand("showGreeting", () => {
      dialog.showMessageBox({
        type: "info",
        title: "FFmpeg",
        message: "FFmpeg plugin is ready!",
        buttons: ["OK"],
      });
    });

    this.context.registerCommand("ping", () => {
      return ffmpeg.checkCommand();
    });

    // Subscribe to events
    this.context.subscribe("app:ready", () => {
      this.logger.info("FFmpeg plugin is ready!");
    });

    this.logger.info("FFmpeg plugin activated");
  }

  async deactivate(): Promise<void> {
    // Clean up resources
    this.logger.info("FFmpeg plugin deactivating");

    // Call parent deactivate method
    await super.deactivate();
  }
}
