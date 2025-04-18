import "recorder-core";
import "recorder-core/src/engine/mp3.js";
import "recorder-core/src/engine/mp3-engine";
import "recorder-core/src/engine/wav.js";
import "recorder-core/src/extensions/frequency.histogram.view.js";
import "recorder-core/src/extensions/lib.fft.js";

import { create } from "zustand";

type RecorderStatus = "initializing" | "idle" | "recording" | "paused";

type RecorderStoreType = {
  status: RecorderStatus;

  maxDuration: number;
  setMaxDuration: (maxDuration: number) => void;

  duration: number;

  histogram: any;
  histogramContainer: HTMLElement | null;
  setupHistogramContainer: (container: HTMLElement) => void;

  accessable: boolean;
  requestPermission: () => Promise<void>;

  recorder: any;
  initRecorder: () => Promise<void>;
  startRecording: () => Promise<boolean>;
  stopRecording: () => void;

  blob: Blob | null;
  clearBlob: () => void;

  error: Error | null;
};

export const useRecorderStore = create<RecorderStoreType>((set, get) => ({
  status: "initializing",

  maxDuration: 1000 * 60, // 1 minute
  setMaxDuration: (maxDuration: number) => set({ maxDuration }),

  duration: 0,
  blob: null,
  clearBlob: () => set({ blob: null, duration: 0 }),

  histogram: null,

  histogramContainer: null,
  setupHistogramContainer: (container: HTMLElement) => {
    set({ histogramContainer: container });
  },

  accessable: false,
  requestPermission: async () => {
    const { recorder } = get();
    if (!recorder) return;

    const accessable =
      await window.EnjoyAPI.system.requestMediaAccess("microphone");

    if (!accessable) {
      set({
        error: new Error("Permission denied"),
      });
    }

    recorder.open(
      () => {
        set({ status: "idle" });
      },
      (msg: string, _isUserNotAllowed: boolean) => {
        set({
          error: new Error(msg || "Permission denied"),
        });
      }
    );

    set({ accessable });
    return accessable;
  },

  recorder: null,
  initRecorder: async () => {
    if (!window) return;

    const recorder: any = new (window as any).Recorder({
      type: "mp3",
      sampleRate: 16000,
      bitRate: 16,
      onProcess: (
        buffers: any,
        powerLevel: any,
        bufferDuration: any,
        bufferSampleRate: any
      ) => {
        // Initialize histogram if it's not already created but container is available
        const histogram = get().histogram;
        if (histogram) {
          histogram.input(
            buffers[buffers.length - 1],
            powerLevel,
            bufferSampleRate
          );
        }

        set({ duration: bufferDuration });
      },
    });

    set({ recorder, status: "idle" });
  },
  startRecording: async () => {
    const { recorder } = get();
    if (!recorder) return false;

    set({ blob: null });
    try {
      // Ensure histogram is initialized if container exists
      if (get().histogramContainer && window) {
        const histogram = (window as any).Recorder.FrequencyHistogramView({
          elem: get().histogramContainer,
        });
        set({ histogram });
      }

      recorder.start();
      recorder.watchDogTimer = setInterval(() => {
        if (!recorder || recorder.watchDogTimer) {
          clearInterval(recorder.watchDogTimer);
          return;
        }
        if (Date.now() < recorder.wdtPauseT) return;
        if (Date.now() - (recorder.processTime || recorder.startTime) > 1500) {
          console.error(
            recorder.processTime ? "录音被中断" : "录音未能正常开始"
          );
        }
        if (
          get().maxDuration &&
          Date.now() - recorder.startTime > get().maxDuration
        ) {
          get().stopRecording();
        }
      }, 1000);
      recorder.startTime = Date.now();
      recorder.wdtPauseT = 0;
      recorder.processTime = 0;

      set({ status: "recording" });

      return true;
    } catch (error) {
      console.error(error);
      set({
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return false;
    }
  },
  stopRecording: async () => {
    const { recorder } = get();
    if (!recorder) return;

    clearInterval(recorder.watchDogTimer);
    recorder.stop(
      (blob: Blob, duration: number) => {
        set({ blob, duration });
        set({ status: "idle", histogram: null });
      },
      (error: Error) => {
        set({
          error: error instanceof Error ? error : new Error(String(error)),
          status: "idle",
        });
      }
    );
  },

  error: null,
}));
