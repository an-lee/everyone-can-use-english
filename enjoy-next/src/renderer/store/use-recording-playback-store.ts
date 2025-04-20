import { create } from "zustand";

type RecordingPlaybackStore = {
  recording: RecordingEntity | null;
  setRecording: (recording: RecordingEntity) => void;

  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;

  currentTime: number;
  setCurrentTime: (currentTime: number) => void;

  frequencies: (number | null)[];
  setFrequencies: (frequencies: (number | null)[]) => void;

  error: Error | null;
  setError: (error: Error | null) => void;

  reset: () => void;
};

export const useRecordingPlaybackStore = create<RecordingPlaybackStore>(
  (set) => ({
    recording: null,
    setRecording: (recording: RecordingEntity) => set({ recording }),

    isPlaying: false,
    setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

    currentTime: 0,
    setCurrentTime: (currentTime: number) => set({ currentTime }),

    error: null,
    setError: (error: Error | null) => set({ error }),

    frequencies: [],
    setFrequencies: (frequencies: (number | null)[]) => set({ frequencies }),

    reset: () =>
      set({
        recording: null,
        isPlaying: false,
        currentTime: 0,
        error: null,
      }),
  })
);
