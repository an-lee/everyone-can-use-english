// Web worker for frequency calculation
import Pitchfinder from "pitchfinder";

// Cache for pitch detectors to avoid recreating them
const pitchDetectorCache = new Map();

// Process message from main thread
self.onmessage = (event) => {
  const { peaks, sampleRate, options = {}, id } = event.data;

  try {
    const frequencies = extractFrequencies({ peaks, sampleRate, options });
    self.postMessage({ frequencies, id, success: true });
  } catch (error: unknown) {
    console.error("Error in frequency worker:", error);
    self.postMessage({
      error: error instanceof Error ? error.message : String(error),
      id,
      success: false,
    });
  }
};

// Extract frequencies from audio data - implementation exactly matching FFmpeg plugin
function extractFrequencies(props: {
  peaks: Float32Array;
  sampleRate: number;
  options?: {
    sensitivity?: number;
    algorithm?: "YIN" | "AMDF" | "ACF2PLUS";
    probabilityThreshold?: number;
    minFrequency?: number;
    maxFrequency?: number;
    windowSize?: number;
    chunkSize?: number;
    skipPostProcessing?: boolean;
    filterType?: "basic" | "language" | "tonal" | "speech";
  };
}): (number | null)[] {
  const { peaks, sampleRate, options = {} } = props;

  // Handle filterType-based options, matching FFmpeg implementation
  const filterType = options.filterType || "language";

  const {
    sensitivity = filterType === "speech" ? 0.03 : 0.05,
    algorithm = filterType === "speech" ? "AMDF" : "YIN",
    probabilityThreshold = filterType === "speech" ? 0.05 : 0.1,
    minFrequency = filterType === "tonal" ? 75 : 85,
    maxFrequency = filterType === "tonal" ? 500 : 400,
    windowSize = 3,
    chunkSize = 100000,
    skipPostProcessing = filterType === "basic",
  } = options;

  // For very large arrays, process in chunks
  if (peaks.length > chunkSize) {
    return processInChunks(peaks, sampleRate, chunkSize, options);
  }

  // Select algorithm based on input option
  let detectPitch;
  const detectorKey = `${algorithm}_${sampleRate}_${minFrequency}_${maxFrequency}_${sensitivity}`;
  const cachedDetector = pitchDetectorCache.get(detectorKey);

  if (cachedDetector) {
    detectPitch = cachedDetector;
  } else if (algorithm === "AMDF") {
    // AMDF (Average Magnitude Difference Function) can work better for some speech
    detectPitch = Pitchfinder.AMDF({
      sampleRate,
      minFrequency,
      maxFrequency,
    });
    pitchDetectorCache.set(detectorKey, detectPitch);
  } else if (algorithm === "ACF2PLUS") {
    // ACF2+ can work better for detecting pitch in noisy environments
    detectPitch = Pitchfinder.ACF2PLUS({
      sampleRate,
    });
    pitchDetectorCache.set(detectorKey, detectPitch);
  } else {
    // YIN is default and generally best for language/tonal detection
    detectPitch = Pitchfinder.YIN({
      sampleRate,
      threshold: sensitivity,
      probabilityThreshold: probabilityThreshold,
    });
    pitchDetectorCache.set(detectorKey, detectPitch);
  }

  const timeStep = 0.01; // 10ms time steps for better resolution of speech
  const quantization = 1 / timeStep;

  // Get raw frequencies
  const frequencies = Pitchfinder.frequencies(detectPitch, peaks, {
    tempo: 60, // Fixed tempo to ensure consistent time steps
    quantization: quantization,
  });

  // Return raw frequencies if post-processing is disabled
  if (skipPostProcessing) {
    return frequencies;
  }

  // Optimize for the common case - no need to copy the array if we don't need to modify it
  let processedFrequencies = frequencies;

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
}

// Process a large audio file in chunks
function processInChunks(
  peaks: Float32Array,
  sampleRate: number,
  chunkSize: number,
  options: any
): (number | null)[] {
  const numberOfChunks = Math.ceil(peaks.length / chunkSize);
  const results: (number | null)[][] = [];

  // Process each chunk with skipPostProcessing=true for performance
  for (let i = 0; i < numberOfChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min((i + 1) * chunkSize, peaks.length);
    const chunkPeaks = peaks.subarray(start, end);

    const chunkFrequencies = extractFrequencies({
      peaks: chunkPeaks,
      sampleRate,
      options: {
        ...options,
        skipPostProcessing: true,
      },
    });

    results.push(chunkFrequencies);
  }

  // Combine results
  const combinedFrequencies = results.flat();

  // Only apply post-processing once on the combined result
  if (options.skipPostProcessing) {
    return combinedFrequencies;
  }

  let processedFrequencies = combinedFrequencies;

  if (options.algorithm === "AMDF") {
    processedFrequencies = applyMedianFiltering(processedFrequencies, 3);
  }

  return removeNoiseWithSmoothing(processedFrequencies, {
    minFrequency: options.minFrequency,
    maxFrequency: options.maxFrequency,
    windowSize: options.windowSize,
    maxGapSize: options.algorithm === "AMDF" ? 8 : 5,
    smoothingFactor: options.algorithm === "AMDF" ? 0.4 : 0.3,
  });
}

// Enhanced noise removal with smoothing for clearer pitch contours
function removeNoiseWithSmoothing(
  frequencies: (number | null)[],
  options: {
    outlierThreshold?: number;
    windowSize?: number;
    minFrequency?: number;
    maxFrequency?: number;
    maxGapSize?: number;
    smoothingFactor?: number;
  } = {}
): (number | null)[] {
  const {
    outlierThreshold = 0.2,
    windowSize = 3,
    minFrequency = 75,
    maxFrequency = 500,
    maxGapSize = 5,
    smoothingFactor = 0.3,
  } = options;

  // Create output array only once
  const result = new Array(frequencies.length);

  // Filter out frequencies outside the human voice range
  for (let i = 0; i < frequencies.length; i++) {
    const freq = frequencies[i];
    result[i] =
      freq !== null && freq >= minFrequency && freq <= maxFrequency
        ? freq
        : null;
  }

  // Fast path: if everything is filtered out or very little data, return early
  const validFrequencies = result.filter((f) => f !== null).length;
  if (validFrequencies < 10) {
    return result;
  }

  // Optimized outlier removal
  for (let i = 1; i < result.length - 1; i++) {
    const freq = result[i];
    if (freq === null) continue;

    // Collect neighbor values within window
    let sum = 0;
    let count = 0;

    for (
      let j = Math.max(0, i - windowSize);
      j <= Math.min(result.length - 1, i + windowSize);
      j++
    ) {
      if (j !== i && result[j] !== null) {
        sum += result[j] as number;
        count++;
      }
    }

    // Skip if not enough neighbors for comparison
    if (count < 2) continue;

    const avgNeighbor = sum / count;
    const deviation = Math.abs(freq - avgNeighbor);

    if (deviation > outlierThreshold * avgNeighbor) {
      result[i] = null;
    }
  }

  // Optimized gap filling
  let i = 0;
  while (i < result.length) {
    if (result[i] !== null) {
      i++;
      continue;
    }

    // Find the start and end of the gap
    const gapStart = i;
    let gapEnd = gapStart;
    while (gapEnd < result.length && result[gapEnd] === null) {
      gapEnd++;
    }

    // Calculate gap size
    const gapSize = gapEnd - gapStart;

    // Only fill gaps that are below the maxGapSize threshold
    if (gapSize <= maxGapSize && gapStart > 0 && gapEnd < result.length) {
      const startValue = result[gapStart - 1] as number;
      const endValue = result[gapEnd] as number;

      // Linear interpolation for each position in the gap
      const increment = (endValue - startValue) / (gapSize + 1);
      for (let j = 0; j < gapSize; j++) {
        result[gapStart + j] = startValue + (j + 1) * increment;
      }
    }

    // Skip to the end of this gap
    i = gapEnd;
  }

  // Optimized smoothing pass
  for (let i = 1; i < result.length - 1; i++) {
    if (result[i] === null) continue;

    const prev = result[i - 1];
    const next = result[i + 1];

    if (prev !== null && next !== null) {
      // Apply weighted moving average for smoothing
      result[i] =
        prev * smoothingFactor +
        (result[i] as number) * (1 - 2 * smoothingFactor) +
        next * smoothingFactor;
    }
  }

  return result;
}

// Apply median filtering to reduce spurious values while preserving edges
function applyMedianFiltering(
  frequencies: (number | null)[],
  windowSize: number = 3
): (number | null)[] {
  // Create result array once
  const result = [...frequencies];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < frequencies.length; i++) {
    // Skip null values
    if (frequencies[i] === null) continue;

    // Use pre-allocated array for neighbors
    const neighbors: number[] = [];
    neighbors.length = 0;

    const startIdx = Math.max(0, i - halfWindow);
    const endIdx = Math.min(frequencies.length - 1, i + halfWindow);

    // Collect neighbor values within window
    for (let j = startIdx; j <= endIdx; j++) {
      if (frequencies[j] !== null) {
        neighbors.push(frequencies[j] as number);
      }
    }

    // If we have enough neighbors, replace with median value
    if (neighbors.length > 2) {
      // Sort in-place
      neighbors.sort((a, b) => a - b);
      const medianIndex = Math.floor(neighbors.length / 2);
      result[i] = neighbors[medianIndex];
    }
  }

  return result;
}
