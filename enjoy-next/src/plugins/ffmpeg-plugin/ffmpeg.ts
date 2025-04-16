import FluentFfmpeg from "fluent-ffmpeg";
import Pitchfinder from "pitchfinder";
import { log } from "@main/core/utils";
import { extractFrequencies, getFfmpegPath } from "./utils";
import { appConfig, enjoyUrlToPath, pathToEnjoyUrl } from "@/main/core";
import path from "path";
import fs from "fs";

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
      windowSize?: number;
    } = {}
  ): Promise<{ frequencies: (number | null)[] }> {
    this.logger.debug(`Getting frequency data for ${url}`);

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
    const outputPath = path.join(appConfig.cachePath(), `${baseName}.pcm`);

    const sampleRate = options.sampleRate || 44100;

    return new Promise((resolve, reject) => {
      this.executable
        .input(filePath)
        .outputOptions(`-ar ${sampleRate}`) // Set sample rate
        .outputOptions("-ac 1") // Convert to mono
        .outputOptions("-map 0:a") // Select audio stream
        .outputOptions("-c:a pcm_f32le") // Use 32-bit float PCM
        .outputOptions("-f f32le") // Raw 32-bit float output format
        .output(outputPath)
        .on("start", (commandLine) => {
          this.logger.debug(`FFmpeg process started: ${commandLine}`);
        })
        .on("end", () => {
          if (fs.existsSync(outputPath)) {
            try {
              // Read the raw PCM data
              const buffer = fs.readFileSync(outputPath);
              const peaks = new Float32Array(buffer.buffer);

              const frequencies = extractFrequencies({
                peaks,
                sampleRate,
              });

              this.logger.debug(
                `Extracted ${frequencies.length} frequency points`
              );
              resolve({ frequencies });
            } catch (err) {
              this.logger.error(`Error processing PCM data: ${err}`);
              reject(err);
            } finally {
              // Clean up temp file
              try {
                fs.unlinkSync(outputPath);
              } catch (e) {
                this.logger.warn(`Failed to delete temp file: ${outputPath}`);
              }
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
