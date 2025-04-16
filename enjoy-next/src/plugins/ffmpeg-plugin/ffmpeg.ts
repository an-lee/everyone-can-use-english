import FluentFfmpeg from "fluent-ffmpeg";
import Pitchfinder from "pitchfinder";
import { log } from "@main/core/utils";
import { extractFrequencies, getFfmpegPath } from "./utils";
import { appConfig, enjoyUrlToPath, pathToEnjoyUrl } from "@/main/core";
import path from "path";
import fs from "fs";
import { app } from "electron";

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

  getFrequencyData(
    url: string,
    options: {
      sampleRate?: number;
      sensitivity?: number;
      minFrequency?: number;
      maxFrequency?: number;
      filterType?: "basic" | "language" | "tonal";
    } = {}
  ): Promise<{
    frequencies: (number | null)[];
    metadata: { duration: number; timeStep: number };
  }> {
    const { filterType = "language" } = options;
    this.logger.debug(
      `Getting frequency data for ${url} with mode: ${filterType}`
    );

    const filePath = enjoyUrlToPath(url);
    if (!fs.existsSync(filePath)) {
      this.logger.error(`File not found: ${filePath}`);
      return Promise.reject(new Error("File not found"));
    }

    if (fs.statSync(filePath).size === 0) {
      this.logger.error(`File is empty: ${filePath}`);
      return Promise.reject(new Error("File is empty"));
    }

    const baseName = path.basename(filePath);
    const outputPath = path.join(app.getPath("temp"), `${baseName}.pcm`);

    // Parameters optimized for language learning
    const sampleRate = options.sampleRate || 22050; // Higher than voice minimum for better tonal accuracy

    // Choose audio filter based on language type
    let audioFilter = "highpass=f=60,lowpass=f=4000,dynaudnorm=f=150:g=15";

    if (filterType === "tonal") {
      // More precise for tonal languages (Chinese, Vietnamese, etc.)
      audioFilter = "highpass=f=60,lowpass=f=5000,dynaudnorm=f=200:g=15:p=0.95";
    }

    return new Promise((resolve, reject) => {
      this.executable
        .input(filePath)
        .outputOptions(`-ar ${sampleRate}`)
        .outputOptions("-ac 1")
        .outputOptions("-map 0:a")
        .outputOptions(`-af ${audioFilter}`)
        .outputOptions("-c:a pcm_f32le")
        .outputOptions("-f f32le")
        .output(outputPath)
        .on("start", (commandLine) => {
          this.logger.debug(`FFmpeg process started: ${commandLine}`);
        })
        .on("end", () => {
          if (fs.existsSync(outputPath)) {
            try {
              const buffer = fs.readFileSync(outputPath);
              const peaks = new Float32Array(buffer.buffer);

              const frequencies = extractFrequencies({
                peaks,
                sampleRate,
                options: {
                  sensitivity: options.sensitivity,
                },
              });

              // Calculate metadata for visualization
              const duration = peaks.length / sampleRate;
              const timeStep = 0.01; // 10ms steps

              this.logger.debug(
                `Extracted ${frequencies.filter((f) => f !== null).length} valid frequency points from ${frequencies.length} total`
              );

              resolve({
                frequencies,
                metadata: {
                  duration,
                  timeStep,
                },
              });
            } catch (err) {
              this.logger.error(`Error processing PCM data: ${err}`);
              reject(err);
            }
          } else {
            this.logger.error("No output from FFmpeg");
            reject(new Error("No output from FFmpeg"));
          }
        })
        .on("error", (err, stdout, stderr) => {
          this.logger.error(
            `Error processing frequency data: ${err}, ${stdout}, ${stderr}`
          );
          reject(err);
        })
        .run();
    });
  }
}

const ffmpeg = new Ffmpeg();

export const commands = [
  {
    name: "checkCommand",
    function: () => ffmpeg.checkCommand(),
  },
  {
    name: "getFrequencyData",
    function: (url: string) => ffmpeg.getFrequencyData(url),
  },
];
