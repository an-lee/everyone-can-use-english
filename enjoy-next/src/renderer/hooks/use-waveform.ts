import { useCallback, useEffect, useRef } from "react";
import { useMeidaPlayBackStore } from "@renderer/store";
import { toast } from "sonner";

// Define types
type AudioData = {
  peaks: Float32Array;
  sampleRate: number;
  cacheKey?: string;
  frequencies?: (number | null)[];
};

// Create a unique ID for each worker request
let nextWorkerId = 0;

// WeakMap to track which media elements have already been processed
// This prevents creating multiple MediaElementSourceNodes for the same element
const processedMediaElements = new WeakMap<HTMLMediaElement, AudioData>();

// Debug mode - set to true to log details about audio processing
const DEBUG_MODE = true;

// Create audio context lazily and reuse it
let sharedAudioContext: AudioContext | null = null;

// Keep track of temp audio elements to clean them up properly
const tempAudioElements = new Set<HTMLAudioElement>();

export const useWaveform = (props: {
  src: string;
  setWaveform: (waveform: {
    peaks: Float32Array;
    sampleRate: number;
    duration: number;
  }) => void;
  setFrequencies: (frequencies: (number | null)[]) => void;
}) => {
  const { setWaveform, setFrequencies, src } = props;
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<
    Map<
      number,
      {
        resolve: (value: any) => void;
        reject: (reason?: any) => void;
      }
    >
  >(new Map());

  // Keep track of the currently processing elements to avoid multiple processing
  const processingElements = useRef<Set<HTMLMediaElement>>(new Set());

  // Initialize the worker
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Create AudioContext if needed
    if (!sharedAudioContext && window.AudioContext) {
      sharedAudioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
    }

    try {
      // Create the worker
      workerRef.current = new Worker(
        new URL("../workers/frequency-worker.ts", import.meta.url),
        { type: "module" }
      );

      // Set up the message handler
      workerRef.current.onmessage = (event) => {
        const { id, frequencies, success, error } = event.data;

        const pending = pendingRequests.current.get(id);
        if (pending) {
          if (success) {
            pending.resolve(frequencies);
          } else {
            pending.reject(new Error(error));
          }
          pendingRequests.current.delete(id);
        }
      };

      // Set up error handler
      workerRef.current.onerror = (error) => {
        console.error("Web worker error:", error);
        toast.error("Error in frequency calculation worker");
      };
    } catch (error) {
      console.error("Failed to initialize frequency worker:", error);
      toast.error("Failed to initialize frequency calculation");
    }

    // Clean up the worker on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }

      // Clean up all temp audio elements
      tempAudioElements.forEach((audio) => {
        audio.pause();
        audio.src = "";
        audio.load();
      });
      tempAudioElements.clear();

      // Suspend audio context to save resources
      if (sharedAudioContext && sharedAudioContext.state !== "closed") {
        sharedAudioContext.suspend();
      }
    };
  }, [src]);

  // Function to extract audio data from an audio/video element
  const extractAudioData = useCallback(
    async (
      audioContext: AudioContext,
      mediaElement: HTMLMediaElement
    ): Promise<AudioData> => {
      return new Promise((resolve, reject) => {
        try {
          // Create a unique cache key
          const cacheKey = mediaElement.src + "-" + mediaElement.duration;

          // Check if this media element has been processed before
          const cachedData = processedMediaElements.get(mediaElement);
          if (cachedData && cachedData.cacheKey === cacheKey) {
            if (DEBUG_MODE)
              console.debug(
                "Media element already processed, using cached data"
              );
            return resolve(cachedData);
          }

          // Check if we're already processing this element
          if (processingElements.current.has(mediaElement)) {
            if (DEBUG_MODE)
              console.debug(
                "Media element is already being processed, skipping"
              );
            return reject(
              new Error("Media element is already being processed")
            );
          }

          // Mark as processing
          processingElements.current.add(mediaElement);

          // Try to use OfflineAudioContext first as it's most reliable
          extractWithOfflineContext(mediaElement)
            .then((result) => {
              // Normalize the peaks to ensure proper display
              result.peaks = normalizePeaks(result.peaks);
              processingElements.current.delete(mediaElement);
              resolve(result);
            })
            .catch((error) => {
              if (DEBUG_MODE)
                console.warn(
                  "OfflineContext extraction failed, trying AnalyserNode",
                  error
                );
              // Try AnalyserNode next
              tryAnalyserExtraction();
            });

          function tryAnalyserExtraction() {
            try {
              extractUsingAnalyser(audioContext, mediaElement)
                .then((result) => {
                  // Normalize peaks before storing
                  result.peaks = normalizePeaks(result.peaks);
                  // Store the result with cacheKey
                  result.cacheKey = cacheKey;
                  processedMediaElements.set(mediaElement, result);
                  processingElements.current.delete(mediaElement);
                  resolve(result);
                })
                .catch((error) => {
                  if (DEBUG_MODE)
                    console.warn(
                      "Analyser extraction failed, falling back to ScriptProcessor",
                      error
                    );
                  fallbackExtract();
                });
            } catch (err) {
              if (DEBUG_MODE)
                console.warn(
                  "Could not use AnalyserNode, falling back to ScriptProcessor",
                  err
                );
              fallbackExtract();
            }
          }

          // Fallback to ScriptProcessor if other methods fail
          function fallbackExtract() {
            try {
              // Create a media element source
              const source =
                audioContext.createMediaElementSource(mediaElement);

              // Create a script processor to get the audio data
              const scriptProcessor = audioContext.createScriptProcessor(
                4096,
                1,
                1
              );
              const peaks: number[] = [];

              // Connect the nodes
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContext.destination);

              // Process the audio data
              scriptProcessor.onaudioprocess = (e) => {
                const inputBuffer = e.inputBuffer;
                const channelData = inputBuffer.getChannelData(0);
                peaks.push(...Array.from(channelData));
              };

              // Wait for the media to load and play
              mediaElement.onloadedmetadata = async () => {
                try {
                  // Store the original time and volume
                  const originalTime = mediaElement.currentTime;
                  const originalVolume = mediaElement.volume;
                  const originalMuted = mediaElement.muted;

                  // Mute to avoid user hearing the audio during capture
                  mediaElement.volume = 0;
                  mediaElement.muted = true;

                  // Set to beginning to ensure we capture the start
                  mediaElement.currentTime = 0;

                  // Play the media to capture audio data
                  await mediaElement.play();

                  // Capture at least 5 seconds or full duration if shorter
                  // This ensures we have enough data for good frequency analysis
                  const captureTime = Math.min(5, mediaElement.duration);

                  if (DEBUG_MODE)
                    console.debug(`Capturing ${captureTime}s of audio data`);

                  setTimeout(async () => {
                    // Stop and disconnect
                    await mediaElement.pause();

                    // Restore original state
                    mediaElement.currentTime = originalTime;
                    mediaElement.volume = originalVolume;
                    mediaElement.muted = originalMuted;

                    // Properly disconnect nodes
                    try {
                      scriptProcessor.disconnect();
                      source.disconnect();
                    } catch (disconnectError) {
                      console.error(
                        "Error disconnecting audio nodes:",
                        disconnectError
                      );
                    }

                    if (peaks.length === 0) {
                      if (DEBUG_MODE)
                        console.warn(
                          "No audio data captured with ScriptProcessor"
                        );
                      processingElements.current.delete(mediaElement);
                      reject(new Error("Failed to capture audio data"));
                      return;
                    }

                    // Convert to Float32Array
                    const peaksArray = new Float32Array(peaks);
                    // Normalize the peaks
                    const normalizedPeaks = normalizePeaks(peaksArray);

                    const result: AudioData = {
                      peaks: normalizedPeaks,
                      sampleRate: audioContext.sampleRate,
                      cacheKey,
                    };

                    if (DEBUG_MODE) {
                      console.debug(
                        `Captured ${peaks.length} samples at ${audioContext.sampleRate}Hz`
                      );
                      // Log some stats about the captured audio
                      const peakValues = Array.from(normalizedPeaks);
                      const min = Math.min(...peakValues);
                      const max = Math.max(...peakValues);
                      const avg =
                        peakValues.reduce((sum, val) => sum + val, 0) /
                        peakValues.length;
                      console.debug(
                        `Audio stats - Min: ${min}, Max: ${max}, Avg: ${avg}`
                      );
                    }

                    // Store the result in our WeakMap for future reference
                    processedMediaElements.set(mediaElement, result);
                    processingElements.current.delete(mediaElement);

                    resolve(result);
                  }, captureTime * 1000);
                } catch (error) {
                  processingElements.current.delete(mediaElement);
                  reject(error);
                }
              };

              mediaElement.onerror = (error) => {
                processingElements.current.delete(mediaElement);
                reject(
                  new Error(
                    `Media error: ${mediaElement.error?.message || "Unknown error"}`
                  )
                );
              };
            } catch (error) {
              // If the error is about MediaElementSourceNode already connected,
              // we need to handle it specially
              if (
                error instanceof DOMException &&
                error.name === "InvalidStateError" &&
                error.message.includes("MediaElementSourceNode")
              ) {
                if (DEBUG_MODE)
                  console.warn(
                    "Media element already connected to another node. Creating an offline analysis."
                  );
                // Use alternative approach with OfflineAudioContext
                extractWithOfflineContext(mediaElement)
                  .then((result) => {
                    processingElements.current.delete(mediaElement);
                    resolve(result);
                  })
                  .catch((err) => {
                    processingElements.current.delete(mediaElement);
                    reject(err);
                  });
              } else {
                processingElements.current.delete(mediaElement);
                reject(error);
              }
            }
          }
        } catch (error) {
          processingElements.current.delete(mediaElement);
          reject(error);
        }
      });
    },
    [src]
  );

  // Helper function to normalize audio peaks
  const normalizePeaks = (peaks: Float32Array): Float32Array => {
    // Find the maximum absolute value in the peaks
    let maxAbsValue = 0;
    for (let i = 0; i < peaks.length; i++) {
      const absValue = Math.abs(peaks[i]);
      if (absValue > maxAbsValue) {
        maxAbsValue = absValue;
      }
    }

    // If the maximum absolute value is too small or zero, return the original peaks
    if (maxAbsValue < 0.01) {
      return peaks;
    }

    // Create a new array for normalized peaks
    const normalizedPeaks = new Float32Array(peaks.length);

    // Normalize values to range between -1 and 1
    for (let i = 0; i < peaks.length; i++) {
      normalizedPeaks[i] = peaks[i] / maxAbsValue;
    }

    return normalizedPeaks;
  };

  // Extract using AnalyserNode for better quality
  const extractUsingAnalyser = async (
    audioContext: AudioContext,
    mediaElement: HTMLMediaElement
  ): Promise<AudioData> => {
    return new Promise((resolve, reject) => {
      try {
        const source = audioContext.createMediaElementSource(mediaElement);
        const analyser = audioContext.createAnalyser();

        // Configure analyser for higher quality
        analyser.fftSize = 2048; // Must be power of 2
        const bufferLength = analyser.fftSize;
        const dataArray = new Float32Array(bufferLength);

        // Connect nodes
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        // Store the original state
        const originalTime = mediaElement.currentTime;
        const originalVolume = mediaElement.volume;
        const originalMuted = mediaElement.muted;

        // Mute to avoid user hearing the audio during capture
        mediaElement.volume = 0;
        mediaElement.muted = true;

        // Set to beginning
        mediaElement.currentTime = 0;

        // Array to store all captured chunks
        const allData: Float32Array[] = [];
        let totalSamples = 0;

        // Function to capture data
        const captureData = () => {
          analyser.getFloatTimeDomainData(dataArray);
          // Clone the data to avoid overwriting
          const dataCopy = new Float32Array(dataArray);
          allData.push(dataCopy);
          totalSamples += dataCopy.length;
        };

        mediaElement.onloadedmetadata = async () => {
          try {
            await mediaElement.play();

            // Capture at least 5 seconds or full duration
            const captureTime = Math.min(5, mediaElement.duration);
            if (DEBUG_MODE)
              console.debug(`Capturing ${captureTime}s with AnalyserNode`);

            // Capture data at regular intervals
            const captureInterval = setInterval(captureData, 50); // 20 captures per second

            setTimeout(async () => {
              clearInterval(captureInterval);

              // One final capture
              captureData();

              // Stop and disconnect
              await mediaElement.pause();

              // Restore original state
              mediaElement.currentTime = originalTime;
              mediaElement.volume = originalVolume;
              mediaElement.muted = originalMuted;

              // Disconnect nodes
              analyser.disconnect();
              source.disconnect();

              if (totalSamples === 0) {
                if (DEBUG_MODE)
                  console.warn("No audio data captured with AnalyserNode");
                reject(
                  new Error("Failed to capture audio data with AnalyserNode")
                );
                return;
              }

              // Combine all captured chunks
              const combinedData = new Float32Array(totalSamples);
              let offset = 0;

              for (const chunk of allData) {
                combinedData.set(chunk, offset);
                offset += chunk.length;
              }

              if (DEBUG_MODE) {
                console.debug(
                  `Captured ${totalSamples} samples at ${audioContext.sampleRate}Hz using AnalyserNode`
                );
                const min = Math.min(...combinedData);
                const max = Math.max(...combinedData);
                const avg =
                  Array.from(combinedData).reduce((sum, val) => sum + val, 0) /
                  combinedData.length;
                console.debug(
                  `Audio stats - Min: ${min}, Max: ${max}, Avg: ${avg}`
                );
              }

              resolve({
                peaks: combinedData,
                sampleRate: audioContext.sampleRate,
              });
            }, captureTime * 1000);
          } catch (error) {
            if (DEBUG_MODE)
              console.error("Error capturing with AnalyserNode:", error);
            reject(error);
          }
        };

        mediaElement.onerror = () => {
          reject(
            new Error(
              `Media error: ${mediaElement.error?.message || "Unknown error"}`
            )
          );
        };
      } catch (error) {
        if (DEBUG_MODE) console.error("Error setting up AnalyserNode:", error);
        reject(error);
      }
    });
  };

  // Alternative approach using OfflineAudioContext - most reliable method
  const extractWithOfflineContext = async (
    mediaElement: HTMLMediaElement
  ): Promise<AudioData> => {
    // Use a fetch-based approach to get audio data directly
    try {
      const sourceUrl = mediaElement.currentSrc || mediaElement.src;

      // Skip special protocol URLs that can't be fetched directly
      if (sourceUrl.startsWith("blob:") || sourceUrl.startsWith("data:")) {
        return Promise.reject(
          new Error("Cannot process blob or data URL directly")
        );
      }

      if (DEBUG_MODE) console.debug(`Fetching audio data from ${sourceUrl}`);

      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch audio data: ${response.status} ${response.statusText}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error("Empty audio data received");
      }

      // Create an audio context just for decoding
      const offlineCtx = new OfflineAudioContext(1, 16000, 44100);

      // Decode the audio data
      const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);

      // Get the audio data
      const peaks = audioBuffer.getChannelData(0);

      if (DEBUG_MODE) {
        console.debug(
          `Extracted ${peaks.length} samples at ${audioBuffer.sampleRate}Hz using OfflineAudioContext`
        );
        if (peaks.length > 0) {
          // Only compute stats on a sample to avoid stack issues
          const sampleSize = Math.min(10000, peaks.length);
          const sampleData = peaks.slice(0, sampleSize);
          const min = Math.min(...sampleData);
          const max = Math.max(...sampleData);
          const avg =
            Array.from(sampleData).reduce((sum, val) => sum + val, 0) /
            sampleSize;
          console.debug(
            `Audio stats (sample of ${sampleSize}): Min: ${min}, Max: ${max}, Avg: ${avg}`
          );
        }
      }

      // Create the result
      const result: AudioData = {
        peaks,
        sampleRate: audioBuffer.sampleRate,
        cacheKey: mediaElement.src + "-" + mediaElement.duration,
      };

      // Cache the result
      processedMediaElements.set(mediaElement, result);

      return result;
    } catch (err) {
      if (DEBUG_MODE)
        console.error("Failed to extract audio with fetch/decode:", err);

      // Fall back to using a temporary audio element
      return new Promise((resolve, reject) => {
        try {
          // Create an audio element to load the same source
          const tempAudio = new Audio();
          tempAudioElements.add(tempAudio); // Track for cleanup

          tempAudio.crossOrigin = "anonymous";
          tempAudio.src = mediaElement.currentSrc || mediaElement.src;

          let cleanupComplete = false;

          // Function to clean up the temporary audio element
          const cleanupAudio = () => {
            if (cleanupComplete) return;
            cleanupComplete = true;

            try {
              tempAudio.pause();
              tempAudio.removeAttribute("src");
              tempAudio.load();
              tempAudioElements.delete(tempAudio);

              // Ensure we clean up any created source nodes
              if (
                window.URL &&
                window.URL.revokeObjectURL &&
                tempAudio.src.startsWith("blob:")
              ) {
                window.URL.revokeObjectURL(tempAudio.src);
              }
            } catch (e) {
              console.error("Error cleaning up temp audio:", e);
            }
          };

          // Set a timeout in case the audio never loads
          const timeout = setTimeout(() => {
            cleanupAudio();
            reject(new Error("Timeout loading audio"));
          }, 30000);

          tempAudio.onloadedmetadata = async () => {
            try {
              // Create an offline context with a reasonable buffer size
              const sampleRate = 16000; // 16kHz quality
              const duration = tempAudio.duration || 5; // Use 5s if duration is unavailable
              const bufferSize = Math.min(
                Math.ceil(duration * sampleRate),
                sampleRate * 10 // Max 10 seconds to avoid memory issues
              );

              const offlineCtx = new OfflineAudioContext(
                1,
                bufferSize,
                sampleRate
              );

              // Create an audio source from the temp audio element
              // Use a different approach since createMediaElementSource is not available on OfflineAudioContext
              // First load the audio data as an array buffer
              const response = await fetch(tempAudio.src);
              const arrayBuffer = await response.arrayBuffer();

              // Then decode it and connect to the offline context
              const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
              const offlineSource = offlineCtx.createBufferSource();
              offlineSource.buffer = audioBuffer;
              offlineSource.connect(offlineCtx.destination);

              // Start playback and rendering
              offlineSource.start(0);
              offlineCtx
                .startRendering()
                .then((renderedBuffer) => {
                  clearTimeout(timeout);

                  // Get the rendered audio data
                  const peaks = renderedBuffer.getChannelData(0);

                  if (DEBUG_MODE) {
                    console.debug(
                      `Rendered ${peaks.length} samples at ${renderedBuffer.sampleRate}Hz using OfflineAudioContext`
                    );
                    if (peaks.length > 0) {
                      // Only compute stats on a sample
                      const sampleSize = Math.min(10000, peaks.length);
                      const sampleData = peaks.slice(0, sampleSize);
                      const min = Math.min(...sampleData);
                      const max = Math.max(...sampleData);
                      const avg =
                        Array.from(sampleData).reduce(
                          (sum, val) => sum + val,
                          0
                        ) / sampleSize;
                      console.debug(
                        `Audio stats (sample of ${sampleSize}): Min: ${min}, Max: ${max}, Avg: ${avg}`
                      );
                    }
                  }

                  // Create the result
                  const result: AudioData = {
                    peaks,
                    sampleRate: renderedBuffer.sampleRate,
                    cacheKey: mediaElement.src + "-" + mediaElement.duration,
                  };

                  // Cache the result
                  processedMediaElements.set(mediaElement, result);

                  // Clean up
                  cleanupAudio();

                  resolve(result);
                })
                .catch((err) => {
                  clearTimeout(timeout);
                  cleanupAudio();
                  if (DEBUG_MODE)
                    console.error(
                      "Failed to render audio in offline context:",
                      err
                    );
                  reject(err);
                });
            } catch (err) {
              clearTimeout(timeout);
              cleanupAudio();
              if (DEBUG_MODE)
                console.error("Failed to set up offline context:", err);
              reject(err);
            }
          };

          tempAudio.onerror = () => {
            clearTimeout(timeout);
            cleanupAudio();
            reject(new Error("Failed to load audio in temp element"));
          };
        } catch (err) {
          if (DEBUG_MODE)
            console.error("Failed completely to extract audio:", err);
          reject(err);
        }
      });
    }
  };

  // Function to calculate frequencies using the web worker
  const calculateFrequencies = useCallback(
    async (
      peaks: Float32Array,
      sampleRate: number,
      options = {}
    ): Promise<(number | null)[]> => {
      if (!workerRef.current) {
        throw new Error("Web worker not initialized");
      }

      const id = nextWorkerId++;

      if (DEBUG_MODE) {
        console.debug(
          `Sending ${peaks.length} samples at ${sampleRate}Hz to worker with options:`,
          options
        );
      }

      return new Promise((resolve, reject) => {
        pendingRequests.current.set(id, { resolve, reject });

        workerRef.current!.postMessage({
          peaks,
          sampleRate,
          options,
          id,
        });
      });
    },
    []
  );

  // Process a media element to extract waveform and frequencies
  const processMediaElement = useCallback(
    async (mediaElement: HTMLMediaElement, src: string, options = {}) => {
      if (!mediaElement) {
        console.error("No media element provided");
        return;
      }

      if (DEBUG_MODE) {
        console.debug(`Processing media element for ${src}`, options);
      }

      try {
        // Check if we already have processed this media element with this src
        const cacheKey = `${src}-${JSON.stringify(options)}`;
        const cachedData = processedMediaElements.get(mediaElement);

        if (
          cachedData &&
          cachedData.cacheKey === cacheKey &&
          cachedData.frequencies
        ) {
          if (DEBUG_MODE)
            console.debug(
              "Using cached frequency data for this media element and source"
            );

          setWaveform({
            peaks: cachedData.peaks,
            sampleRate: cachedData.sampleRate,
            duration: mediaElement.duration,
          });

          setFrequencies(cachedData.frequencies);
          return {
            peaks: cachedData.peaks,
            frequencies: cachedData.frequencies,
          };
        }

        // If we're already processing this element, avoid multiple parallel processing
        if (processingElements.current.has(mediaElement)) {
          if (DEBUG_MODE)
            console.debug(
              "Media element is already being processed, waiting..."
            );
          // Wait a bit and check again for cached data (previous process might have completed)
          await new Promise((resolve) => setTimeout(resolve, 500));
          const updatedCachedData = processedMediaElements.get(mediaElement);
          if (updatedCachedData && updatedCachedData.frequencies) {
            setWaveform({
              peaks: updatedCachedData.peaks,
              sampleRate: updatedCachedData.sampleRate,
              duration: mediaElement.duration,
            });
            setFrequencies(updatedCachedData.frequencies);
            return {
              peaks: updatedCachedData.peaks,
              frequencies: updatedCachedData.frequencies,
            };
          }

          // If still nothing, return null rather than starting a parallel process
          console.warn(
            "Media element is still being processed, skipping this request"
          );
          return null;
        }

        // Create audio context if needed
        if (!sharedAudioContext) {
          sharedAudioContext = new (window.AudioContext ||
            (window as any).webkitAudioContext)({
            sampleRate: 44100,
          });
        } else if (sharedAudioContext.state === "suspended") {
          await sharedAudioContext.resume();
        }

        // Extract audio data
        const { peaks, sampleRate } = await extractAudioData(
          sharedAudioContext,
          mediaElement
        );

        // Save the waveform data
        setWaveform({
          peaks,
          sampleRate,
          duration: mediaElement.duration,
        });

        if (DEBUG_MODE) {
          console.debug(
            `Extracted ${peaks.length} samples at ${sampleRate}Hz, calculating frequencies...`
          );
        }

        // Calculate frequencies using the worker
        const frequencies = await calculateFrequencies(
          peaks,
          sampleRate,
          options
        );

        if (DEBUG_MODE) {
          const validFreqs = frequencies.filter((f) => f !== null).length;
          console.debug(
            `Calculated ${frequencies.length} frequencies, ${validFreqs} valid (${((validFreqs / frequencies.length) * 100).toFixed(1)}%)`
          );
        }

        // Save the frequencies
        setFrequencies(frequencies);

        // Update cache with frequencies
        const updatedData: AudioData = {
          peaks,
          sampleRate,
          frequencies,
          cacheKey,
        };

        processedMediaElements.set(mediaElement, updatedData);

        return { peaks, frequencies };
      } catch (error) {
        console.error("Error processing media element:", error);
        toast.error("Failed to process audio data");
        return null;
      }
    },
    [extractAudioData, calculateFrequencies, setWaveform, setFrequencies]
  );

  return {
    processMediaElement,
    // Add a cleanup method to clear cached data for a specific media element
    cleanupElement: (mediaElement: HTMLMediaElement) => {
      if (processingElements.current.has(mediaElement)) {
        processingElements.current.delete(mediaElement);
      }
      processedMediaElements.delete(mediaElement);
    },
  };
};
