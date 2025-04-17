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
    algorithm?: "YIN" | "AMDF" | "ACF2PLUS";
    probabilityThreshold?: number;
    minFrequency?: number;
    maxFrequency?: number;
    windowSize?: number;
  };
}): (number | null)[] => {
  const { peaks, sampleRate, options = {} } = props;
  const {
    sensitivity = 0.05,
    algorithm = "AMDF",
    probabilityThreshold = 0.1,
    minFrequency = 75,
    maxFrequency = 500,
    windowSize = 3,
  } = options;

  // Select algorithm based on input option
  let detectPitch;
  if (algorithm === "AMDF") {
    // AMDF (Average Magnitude Difference Function) can work better for some speech
    detectPitch = Pitchfinder.AMDF({
      sampleRate,
      minFrequency,
      maxFrequency,
    });
  } else if (algorithm === "ACF2PLUS") {
    // ACF2+ can work better for detecting pitch in noisy environments
    detectPitch = Pitchfinder.ACF2PLUS({
      sampleRate,
    });
  } else {
    // YIN is default and generally best for language/tonal detection
    detectPitch = Pitchfinder.YIN({
      sampleRate,
      threshold: sensitivity,
      probabilityThreshold: probabilityThreshold,
    });
  }

  const timeStep = 0.01; // 10ms time steps for better resolution of speech
  const quantization = 1 / timeStep;

  const frequencies = Pitchfinder.frequencies(detectPitch, peaks, {
    tempo: 60, // Fixed tempo to ensure consistent time steps
    quantization: quantization,
  });

  // For AMDF, apply additional post-processing to improve contour
  let processedFrequencies = [...frequencies];

  if (algorithm === "AMDF") {
    // Apply additional median filtering to remove spurious frequencies
    processedFrequencies = applyMedianFiltering(processedFrequencies, 3);
  }

  // Clean the frequencies data for better visualization
  const cleanedFrequencies = removeNoiseWithSmoothing(processedFrequencies, {
    minFrequency,
    maxFrequency,
    windowSize,
    // Higher max gap size and smoothing for AMDF
    maxGapSize: algorithm === "AMDF" ? 8 : 5,
    smoothingFactor: algorithm === "AMDF" ? 0.4 : 0.3,
  });

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
    maxGapSize?: number;
    smoothingFactor?: number;
  } = {}
): (number | null)[] => {
  const {
    outlierThreshold = 0.2,
    windowSize = 3,
    minFrequency = 75,
    maxFrequency = 500,
    maxGapSize = 5,
    smoothingFactor = 0.3,
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

  // Second pass: Fill small gaps with linear interpolation
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] !== null) continue;

    // Find the start of the gap
    const gapStart = i;

    // Find the end of the gap
    let gapEnd = gapStart;
    while (gapEnd < filtered.length && filtered[gapEnd] === null) {
      gapEnd++;
    }

    // Calculate gap size
    const gapSize = gapEnd - gapStart;

    // Only fill gaps that are below the maxGapSize threshold
    if (gapSize <= maxGapSize && gapStart > 0 && gapEnd < filtered.length) {
      const startValue = filtered[gapStart - 1] as number;
      const endValue = filtered[gapEnd] as number;

      // Linear interpolation for each position in the gap
      for (let j = 0; j < gapSize; j++) {
        const ratio = (j + 1) / (gapSize + 1);
        filtered[gapStart + j] = startValue + ratio * (endValue - startValue);
      }
    }

    // Skip to the end of this gap
    i = gapEnd - 1;
  }

  // Third pass: Apply smoothing to reduce jagged transitions
  const smoothed = [...filtered];
  for (let i = 1; i < smoothed.length - 1; i++) {
    if (smoothed[i] === null) continue;

    const prev = smoothed[i - 1];
    const next = smoothed[i + 1];

    if (prev !== null && next !== null) {
      // Apply weighted moving average for smoothing
      smoothed[i] =
        prev * smoothingFactor +
        (smoothed[i] as number) * (1 - 2 * smoothingFactor) +
        next * smoothingFactor;
    }
  }

  return smoothed;
};

// Apply median filtering to reduce spurious values while preserving edges
const applyMedianFiltering = (
  frequencies: (number | null)[],
  windowSize: number = 3
): (number | null)[] => {
  const result = [...frequencies];

  for (let i = 0; i < frequencies.length; i++) {
    // Skip null values
    if (frequencies[i] === null) continue;

    // Collect neighbor values within window (including current value)
    const neighbors: number[] = [];
    for (
      let j = Math.max(0, i - Math.floor(windowSize / 2));
      j <= Math.min(frequencies.length - 1, i + Math.floor(windowSize / 2));
      j++
    ) {
      if (frequencies[j] !== null) {
        neighbors.push(frequencies[j] as number);
      }
    }

    // If we have enough neighbors, replace with median value
    if (neighbors.length > 2) {
      neighbors.sort((a, b) => a - b);
      const medianIndex = Math.floor(neighbors.length / 2);
      result[i] = neighbors[medianIndex];
    }
  }

  return result;
};
