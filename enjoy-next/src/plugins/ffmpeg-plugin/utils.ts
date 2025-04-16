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
  options?: {
    sensitivity?: number;
  };
}): (number | null)[] => {
  const { peaks, sampleRate, options = {} } = props;
  const { sensitivity = 0.05 } = options;

  // For language learning, YIN algorithm is more accurate for tonal detection
  const detectPitch = Pitchfinder.YIN({
    sampleRate,
    threshold: sensitivity,
    probabilityThreshold: 0.1,
  });

  const timeStep = 0.01; // 10ms time steps for better resolution of speech
  const quantization = 1 / timeStep;

  const frequencies = Pitchfinder.frequencies(detectPitch, peaks, {
    tempo: 60, // Fixed tempo to ensure consistent time steps
    quantization: quantization,
  });

  // Clean the frequencies data for better visualization
  const cleanedFrequencies = removeNoiseWithSmoothing(frequencies);

  return cleanedFrequencies;
};

// Enhanced noise removal with smoothing for clearer pitch contours
export const removeNoiseWithSmoothing = (
  frequencies: (number | null)[],
  options: {
    outlierThreshold?: number;
    windowSize?: number;
    minFrequency?: number;
    maxFrequency?: number;
  } = {}
): (number | null)[] => {
  const {
    outlierThreshold = 0.2,
    windowSize = 3,
    minFrequency = 75,
    maxFrequency = 500,
  } = options;

  // Filter out frequencies outside the human voice range
  const filtered = frequencies.map((freq) =>
    freq !== null && freq >= minFrequency && freq <= maxFrequency ? freq : null
  );

  // First pass: Remove outliers
  filtered.forEach((freq, i) => {
    if (i === 0 || i === filtered.length - 1 || freq === null) return;

    const neighbors: number[] = [];
    for (
      let j = Math.max(0, i - windowSize);
      j <= Math.min(filtered.length - 1, i + windowSize);
      j++
    ) {
      if (j !== i && filtered[j] !== null) {
        neighbors.push(filtered[j] as number);
      }
    }

    // Skip if not enough neighbors for comparison
    if (neighbors.length < 2) return;

    const avgNeighbor =
      neighbors.reduce((sum, val) => sum + val, 0) / neighbors.length;
    const deviation = Math.abs(freq - avgNeighbor);

    if (deviation > outlierThreshold * avgNeighbor) {
      filtered[i] = null;
    }
  });

  // Second pass: Interpolate small gaps
  for (let i = 1; i < filtered.length - 1; i++) {
    if (
      filtered[i] === null &&
      filtered[i - 1] !== null &&
      filtered[i + 1] !== null
    ) {
      // Interpolate single null values between two valid values
      filtered[i] =
        ((filtered[i - 1] as number) + (filtered[i + 1] as number)) / 2;
    }
  }

  return filtered;
};
