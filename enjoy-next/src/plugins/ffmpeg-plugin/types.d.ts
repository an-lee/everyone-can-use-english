/**
 * Common audio processing options shared between waveform and frequency data
 */
declare type AudioProcessOptions = {
  sampleRate?: number;
  filterType?: "basic" | "language" | "tonal" | "speech";
  timeoutMs?: number;
  enhanceSpeech?: boolean;
  downsampling?: boolean;
};
