import FluentFfmpeg from "fluent-ffmpeg";
import { log } from "@main/core/utils";
import { getFfmpegPath } from "./ffmpeg-utils";

export class Ffmpeg {
  public executable = FluentFfmpeg();
  private logger = log.scope("ffmpeg-plugin");

  constructor() {
    try {
      const ffmpegPathFixed = getFfmpegPath();

      if (ffmpegPathFixed) {
        this.logger.debug(`Using FFmpeg from path: ${ffmpegPathFixed}`);
        this.executable.setFfmpegPath(ffmpegPathFixed);
      } else {
        this.logger.error("Could not locate FFmpeg binary path");
      }
    } catch (error) {
      this.logger.error("Error initializing FFmpeg:", error);
    }
  }

  checkCommand(): Promise<boolean> {
    return new Promise((resolve, _reject) => {
      try {
        this.executable.getAvailableFormats((err, formats) => {
          if (err) {
            this.logger.error("FFmpeg command not valid", err);
            resolve(false);
          } else {
            this.logger.info(
              `FFmpeg command valid, available formats: ${
                Object.keys(formats).length
              }`
            );
            resolve(true);
          }
        });
      } catch (error) {
        this.logger.error("Error checking FFmpeg command:", error);
        resolve(false);
      }
    });
  }
}
