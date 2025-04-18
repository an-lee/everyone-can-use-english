import FluentFfmpeg from "fluent-ffmpeg";
import { log } from "@main/core/utils";
import { extractFrequencies, getFfmpegPath } from "./utils";
import { enjoyUrlToPath } from "@/main/core";
import path from "path";
import fs from "fs";
import { app } from "electron";
import crypto from "crypto";

// Limits and timeouts
const MAX_CONCURRENT_FFMPEG = 2;
const FFMPEG_TIMEOUT_MS = 60000; // 1 minute timeout
const OPERATION_QUEUE = new Map<
  string,
  {
    id: string;
    filePath: string;
    timer?: NodeJS.Timeout;
    controller?: AbortController;
  }
>();
let currentProcesses = 0;

export class Ffmpeg {
  private logger = log.scope("ffmpeg-plugin");

  /**
   * Check if FFmpeg is properly installed and available
   */
  checkCommand(): Promise<boolean> {
    return this.runFfmpegCommand((cmd) => cmd.getAvailableFormats())
      .then((formats) => {
        this.logger.info(
          `FFmpeg valid, available formats: ${Object.keys(formats as object).length}`
        );
        return true;
      })
      .catch((err) => {
        this.logger.error("FFmpeg command not valid", err);
        return false;
      });
  }

  /**
   * Extract frequency data from an audio file
   * @param url The audio file URL
   * @param options Processing options
   */
  getFrequencyData(
    url: string,
    options: {
      sampleRate?: number;
      sensitivity?: number;
      filterType?: "basic" | "language" | "tonal" | "speech";
      timeoutMs?: number;
      algorithm?: "YIN" | "AMDF" | "ACF2PLUS";
      enhanceSpeech?: boolean;
      downsampling?: boolean; // New option to enable automatic downsampling for large files
    } = {}
  ): Promise<{
    frequencies: (number | null)[];
    metadata: { duration: number; timeStep: number };
  }> {
    const {
      filterType = "language",
      timeoutMs = FFMPEG_TIMEOUT_MS,
      enhanceSpeech = true,
      downsampling = true,
    } = options;

    this.logger.debug(
      `Getting frequency data for ${url} with mode: ${filterType}`
    );

    // Validate the file asynchronously
    const filePath = enjoyUrlToPath(url);

    // Create unique ID and paths
    const operationId = crypto.randomUUID();
    const baseName = path.basename(filePath);
    const uniqueSuffix = `${Date.now()}-${operationId}`;
    const outputPath = path.join(
      app.getPath("temp"),
      `${baseName}-${uniqueSuffix}.pcm`
    );

    // Configure options - preset sampleRate based on content type for performance
    let sampleRate =
      options.sampleRate || (filterType === "speech" ? 16000 : 22050); // Lower sample rate for speech

    // Create abort controller for timeout
    const controller = new AbortController();

    // Create timeout timer
    const timer = setTimeout(() => {
      this.logger.warn(`Timeout reached for operation ${operationId}`);
      controller.abort();
      this.cleanupOperation(operationId, outputPath);
    }, timeoutMs);

    // Define the audio filters as a lookup map for better performance
    const audioFilters = {
      tonal: "highpass=f=60,lowpass=f=5000,dynaudnorm=f=200:g=15:p=0.95",
      speech:
        "highpass=f=80,lowpass=f=3500,equalizer=f=200:width_type=o:width=1:g=2,equalizer=f=1000:width_type=o:width=1:g=1,dynaudnorm=f=150:g=15",
      language: enhanceSpeech
        ? "highpass=f=60,lowpass=f=4000,equalizer=f=1000:width_type=o:width=1:g=1,dynaudnorm=f=150:g=15:p=0.9"
        : "highpass=f=60,lowpass=f=4000,dynaudnorm=f=150:g=15",
      basic: "anull", // No filtering for basic mode, use as-is
    };

    // Get the correct audio filter directly from the map
    const audioFilter = audioFilters[filterType] || audioFilters.language;

    return Promise.all([
      // Check if file exists asynchronously
      fs.promises.access(filePath).catch(() => {
        throw new Error("File not found");
      }),

      // Check file size asynchronously
      fs.promises.stat(filePath).then((stats) => {
        if (stats.size === 0) {
          throw new Error("File is empty");
        }

        // Check if downsampling should be applied for large files
        if (downsampling && stats.size > 10 * 1024 * 1024) {
          // > 10MB
          sampleRate = Math.min(sampleRate, 16000); // Reduce sample rate for large files
          this.logger.debug(
            `Large file detected (${stats.size} bytes), downsampling to ${sampleRate}Hz`
          );
        }

        return stats;
      }),

      // Check if already processing
      Promise.resolve().then(() => {
        for (const [_, operation] of OPERATION_QUEUE.entries()) {
          if (operation.filePath === filePath) {
            throw new Error("File is already being processed");
          }
        }
      }),
    ])
      .then(() => {
        // Register operation
        OPERATION_QUEUE.set(operationId, {
          id: operationId,
          filePath,
          timer,
          controller,
        });

        return this.waitForProcessSlot();
      })
      .then(() => {
        // Extract duration and PCM data in parallel
        return Promise.all([
          this.extractDuration(filePath, controller.signal),
          this.extractPCMData(filePath, outputPath, {
            sampleRate,
            audioFilter,
            signal: controller.signal,
          }),
        ]);
      })
      .then(([duration, peaks]) => {
        // Process the frequency data with optimized settings
        const frequencies = extractFrequencies({
          peaks,
          sampleRate,
          options: {
            sensitivity:
              options.sensitivity || (filterType === "speech" ? 0.03 : 0.05),
            // Use AMDF for speech, YIN for tonal content
            algorithm:
              options.algorithm || (filterType === "speech" ? "AMDF" : "YIN"),
            // Higher probability threshold for speech to detect more segments
            probabilityThreshold: filterType === "speech" ? 0.05 : 0.1,
            // Adjust frequency range based on content type
            minFrequency: filterType === "tonal" ? 75 : 85,
            maxFrequency: filterType === "tonal" ? 500 : 400,
            // Use chunked processing for large files
            chunkSize: 100000,
            // Skip post-processing for basic mode
            skipPostProcessing: filterType === "basic",
          },
        });

        // Calculate metadata
        const calculatedDuration = peaks.length / sampleRate;
        const timeStep = 0.01; // 10ms steps

        // Use the more accurate duration
        const finalDuration =
          Math.abs(calculatedDuration - duration) > 5
            ? duration
            : calculatedDuration;

        this.logger.debug(
          `Extracted ${frequencies.filter((f) => f !== null).length} valid frequencies from ${frequencies.length} total. Duration: ${finalDuration}s`
        );

        return {
          frequencies,
          metadata: {
            duration: finalDuration,
            timeStep,
          },
        };
      })
      .finally(() => {
        this.cleanupOperation(operationId, outputPath);
      });
  }

  /**
   * Wait until a processing slot is available
   */
  private waitForProcessSlot(): Promise<void> {
    if (currentProcesses < MAX_CONCURRENT_FFMPEG) {
      currentProcesses++;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const checkAgain = () => {
        if (currentProcesses < MAX_CONCURRENT_FFMPEG) {
          currentProcesses++;
          resolve();
        } else {
          setTimeout(checkAgain, 100);
        }
      };

      checkAgain();
    });
  }

  /**
   * Extract audio duration using FFmpeg
   */
  private extractDuration(
    filePath: string,
    signal?: AbortSignal
  ): Promise<number> {
    return this.runFfmpegCommand((cmd) => {
      // Use standard ffmpeg with optimized settings for quick duration extraction
      cmd
        .input(filePath)
        .noVideo()
        .outputOptions(["-f", "null"])
        .output("/dev/null");

      // Handle abort signal
      if (signal) {
        signal.addEventListener("abort", () => cmd.kill("SIGKILL"));
      }

      return new Promise<number>((resolve, reject) => {
        let duration = 0;

        cmd
          .on("stderr", (stderrLine: string) => {
            // Extract duration from ffmpeg output
            const durationMatch = stderrLine.match(
              /Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/
            );
            if (durationMatch) {
              const hours = parseInt(durationMatch[1]);
              const minutes = parseInt(durationMatch[2]);
              const seconds = parseInt(durationMatch[3]);
              const milliseconds = parseInt(durationMatch[4]) * 10;

              duration =
                hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;

              this.logger.debug(`Found duration: ${duration}s`);
            }
          })
          .on("end", () => {
            // Always resolve, even if duration is 0
            // The calculated duration from PCM data will be used as a fallback
            resolve(duration);
          })
          // @ts-ignore: fluent-ffmpeg typings don't properly define error event
          .on("error", (err: Error) => {
            if (signal?.aborted) {
              reject(new Error("Operation aborted"));
            } else {
              this.logger.error(`Error getting duration: ${err.message}`);
              resolve(0); // Will use calculated duration instead
            }
          })
          .run();
      });
    }).catch((err) => {
      this.logger.error(`Failed to get duration: ${err.message}`);
      // Default to a 0 duration on error, will use PCM calculation instead
      return 0;
    });
  }

  /**
   * Extract PCM audio data using FFmpeg
   */
  private extractPCMData(
    filePath: string,
    outputPath: string,
    options: {
      sampleRate: number;
      audioFilter: string;
      signal?: AbortSignal;
    }
  ): Promise<Float32Array> {
    return this.runFfmpegCommand((cmd) => {
      // Optimize the command for better performance
      cmd
        .input(filePath)
        .outputOptions(`-ar ${options.sampleRate}`) // Sample rate
        .outputOptions("-ac 1") // Mono audio
        .outputOptions("-map 0:a") // Select audio stream
        .outputOptions(`-af ${options.audioFilter}`) // Apply audio filter
        .outputOptions("-c:a pcm_f32le") // Output codec
        .outputOptions("-f f32le") // Output format
        // Add new options for better performance
        .outputOptions("-threads 0") // Use optimal thread count
        .outputOptions("-movflags faststart") // Optimize for streaming
        .output(outputPath);

      // Handle abort signal
      if (options.signal) {
        options.signal.addEventListener("abort", () => cmd.kill("SIGKILL"));
      }

      return new Promise<Float32Array>((resolve, reject) => {
        cmd
          .on("start", (cmdLine: string) => {
            this.logger.debug(`FFmpeg PCM extraction started: ${cmdLine}`);
          })
          .on("end", () => {
            this.logger.debug(`FFmpeg PCM extraction complete: ${outputPath}`);

            if (!fs.existsSync(outputPath)) {
              reject(new Error("FFmpeg did not produce output file"));
              return;
            }

            try {
              // Use asynchronous file read for better performance
              const buffer = fs.readFileSync(outputPath);
              let peaks: Float32Array;

              try {
                // First try direct conversion
                peaks = new Float32Array(
                  buffer.buffer,
                  buffer.byteOffset,
                  buffer.byteLength / 4
                );
              } catch (e: any) {
                // If direct conversion fails, use optimized buffer copy
                this.logger.debug(
                  `Direct buffer conversion failed: ${e.message}`
                );

                const remainder = buffer.length % 4;
                const newLength = buffer.length - remainder;

                if (newLength < 4) {
                  throw new Error("Audio data too small");
                }

                // Create properly sized buffer
                peaks = new Float32Array(newLength / 4);

                // Use a DataView for faster buffer copy
                const view = new DataView(buffer.buffer);
                for (let i = 0; i < newLength; i += 4) {
                  if (i + 3 < newLength) {
                    peaks[i / 4] = view.getFloat32(i, true); // true = little endian
                  }
                }
              }

              resolve(peaks);
            } catch (err) {
              reject(err);
            }
          })
          // @ts-ignore: fluent-ffmpeg typings don't properly define error event
          .on("error", (err: Error) => {
            if (options.signal?.aborted) {
              reject(new Error("Operation aborted"));
            } else {
              this.logger.error(`Error extracting PCM data: ${err.message}`);
              reject(err);
            }
          })
          .run();
      });
    });
  }

  /**
   * Run an FFmpeg command with a fresh instance
   */
  private runFfmpegCommand<T>(fn: (cmd: any) => Promise<T>): Promise<T> {
    try {
      const ffmpegPath = getFfmpegPath();
      const cmd = FluentFfmpeg();

      if (ffmpegPath) {
        cmd.setFfmpegPath(ffmpegPath);
      } else {
        return Promise.reject(new Error("FFmpeg path not found"));
      }

      return fn(cmd).finally(() => {
        currentProcesses--;
      });
    } catch (err) {
      currentProcesses--;
      return Promise.reject(err);
    }
  }

  /**
   * Clean up resources for an operation
   */
  private cleanupOperation(operationId: string, ...filePaths: string[]): void {
    const operation = OPERATION_QUEUE.get(operationId);

    if (operation) {
      // Clear timeout
      if (operation.timer) {
        clearTimeout(operation.timer);
      }

      // Remove from queue
      OPERATION_QUEUE.delete(operationId);
    }

    // Delete temporary files
    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          this.logger.debug(`Deleted temp file: ${filePath}`);
        } catch (e) {
          this.logger.warn(`Failed to delete temp file: ${filePath}`);
        }
      }
    }
  }

  /**
   * Check if there are operations in progress
   */
  areOperationsInProgress(): boolean {
    return OPERATION_QUEUE.size > 0;
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
    function: (url: string, options = {}) =>
      ffmpeg.getFrequencyData(url, options),
  },
];
