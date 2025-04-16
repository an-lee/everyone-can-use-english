import Pitchfinder from "pitchfinder";
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

export const extractFrequencies = (props: {
  peaks: Float32Array;
  sampleRate: number;
}): (number | null)[] => {
  const { peaks, sampleRate } = props;

  const detectPitch = Pitchfinder.AMDF({
    sampleRate,
    sensitivity: 0.05,
  });
  const duration = peaks.length / sampleRate;
  const bpm = peaks.length / duration / 60;

  const frequencies = Pitchfinder.frequencies(detectPitch, peaks, {
    tempo: bpm,
    quantization: bpm,
  });

  const cleanedFrequencies = removeNoise(frequencies);

  return cleanedFrequencies;
};

export const removeNoise = (
  numbers: (number | null)[],
  threshold: number = 0.2
): (number | null)[] => {
  numbers.forEach((num, i) => {
    if (i === 0) return;
    if (typeof num !== "number") return;

    const prevNum = numbers[i - 1] || num;
    const nextNum = numbers[i + 1] || num;
    const avgNeighbor = (prevNum + nextNum) / 2.0;
    const deviation = Math.abs(num - avgNeighbor);

    if (deviation > threshold * avgNeighbor) {
      numbers[i] = null;
    }
  });

  return numbers;
};
