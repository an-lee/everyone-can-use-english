import path from "path";
import fs from "fs";
import { app } from "electron";
import { log } from "@main/core";
import { PreloadApiGenerator } from "./preload-generator";

const logger = log.scope("PreloadApiManager");

/**
 * Manages the preload API files and registration
 */
export class PreloadApiManager {
  private static generatedApiPath = "";
  private static apiTypes: string[] = [];

  /**
   * Initialize the preload API manager
   */
  static init(): void {
    this.generatePreloadApi();

    // Setup listeners for plugin changes
    // This would listen for plugin changes to regenerate the API
    logger.info("Preload API manager initialized");
  }

  /**
   * Generate or update the preload API
   */
  static async generatePreloadApi(): Promise<void> {
    try {
      // First, determine the path of the generated API
      const outputDir = path.join(app.getPath("userData"), "generated");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      this.generatedApiPath = path.join(outputDir, "preload-api.ts");

      // Generate the API
      await PreloadApiGenerator.generatePreloadApi(this.generatedApiPath);

      logger.info(`Generated preload API at ${this.generatedApiPath}`);

      // Also generate a copy in the source directory for type checking/IDE support
      if (process.env.NODE_ENV === "development") {
        const sourceDir = path.join(__dirname, "../../../generated");
        if (!fs.existsSync(sourceDir)) {
          fs.mkdirSync(sourceDir, { recursive: true });
        }

        const sourceFilePath = path.join(sourceDir, "preload-api.ts");
        fs.copyFileSync(this.generatedApiPath, sourceFilePath);
        logger.info(
          `Copied preload API to source directory: ${sourceFilePath}`
        );
      }
    } catch (error) {
      logger.error("Error generating preload API:", error);
    }
  }

  /**
   * Register additional API types
   */
  static registerApiType(typeName: string): void {
    if (!this.apiTypes.includes(typeName)) {
      this.apiTypes.push(typeName);
      logger.debug(`Registered API type: ${typeName}`);
    }
  }

  /**
   * Cleans up the API manager resources
   */
  static cleanup(): void {
    // Nothing to clean up at this time
    logger.info("Preload API manager cleaned up");
  }
}

export default PreloadApiManager;
