import { createRequire } from "module";
import { log } from "@main/core/utils";

const logger = log.scope("ffmpeg-utils");

/**
 * Get the ffmpeg binary path in an ES module context
 * This handles the issues with __dirname not being available in ES modules
 */
export function getFfmpegPath(): string | null {
  try {
    // Create a require function that can be used within ES modules
    const require = createRequire(import.meta.url);
    // Use require to load ffmpeg-static
    const ffmpegPath = require("ffmpeg-static");

    if (!ffmpegPath) {
      logger.warn("Could not find ffmpeg-static path");
      return null;
    }

    // Replace app.asar with app.asar.unpacked if we're in an Electron app
    return ffmpegPath.replace("app.asar", "app.asar.unpacked");
  } catch (error) {
    logger.error("Error loading ffmpeg-static:", error);
    return null;
  }
}
