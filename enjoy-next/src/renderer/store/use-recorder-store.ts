import "recorder-core";
import "recorder-core/src/engine/mp3.js";
import "recorder-core/src/engine/mp3-engine";
import "recorder-core/src/engine/wav.js";
import "recorder-core/src/extensions/frequency.histogram.view.js";
import "recorder-core/src/extensions/lib.fft.js";

import { create } from "zustand";

type RecorderState = {
  status: "idle" | "recording" | "error";

  maxDuration: number;
  setMaxDuration: (maxDuration: number) => void;

  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;

  duration: number;

  histogram: any;
  setupHistogram: (container: HTMLElement) => void;

  permissionGrant: boolean;
  requestPermission: () => Promise<void>;

  recorder: any;
  initRecorder: () => Promise<void>;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<[Blob, number]>;
};

export const useRecorderStore = create<RecorderState>((set, get) => ({
  status: "idle",

  maxDuration: 1000 * 60, // 1 minute
  setMaxDuration: (maxDuration: number) => set({ maxDuration }),

  isRecording: false,
  setIsRecording: (isRecording: boolean) => set({ isRecording }),

  duration: 0,

  histogram: null,
  setupHistogram: (container: HTMLElement) => {
    if (container && window) {
      const histogram = (window as any).Recorder.FrequencyHistogramView({
        elem: container,
      });
      set({ histogram });
    }
  },

  permissionGrant: false,
  requestPermission: async () => {},

  recorder: null,
  initRecorder: async () => {
    if (!window) return;
    if (get().recorder) return;

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
        if (get().histogram) {
          get().histogram.input(
            buffers[buffers.length - 1],
            powerLevel,
            bufferSampleRate
          );
        }

        set({ duration: bufferDuration });
      },
    });

    set({ recorder });
  },
  startRecording: async () => {
    const { recorder } = get();
    if (!recorder) return false;

    try {
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
          set({ status: "error" });
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
      set({ status: "error" });
      return false;
    }
  },
  stopRecording: async () => {
    const { recorder } = get();
    clearInterval(recorder.watchDogTimer);
    try {
      return await recorder.stop();
    } catch (error) {
      console.error(error);
      set({ status: "error" });
    }
  },
}));
