import { create } from "zustand";

type SpeechPlaybackStore = {
  currentSpeech: SpeechEntity | null;
  setCurrentSpeech: (speech: SpeechEntity) => void;

  currentTime: number;
  setCurrentTime: (currentTime: number) => void;

  duration: number;
  setDuration: (duration: number) => void;

  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;

  isPaused: boolean;
  setIsPaused: (isPaused: boolean) => void;

  reset: () => void;
};

export const useSpeechPlaybackStore = create<SpeechPlaybackStore>((set) => ({
  currentSpeech: null,
  setCurrentSpeech: (speech) => set({ currentSpeech: speech }),

  currentTime: 0,
  setCurrentTime: (currentTime) => set({ currentTime }),

  duration: 0,
  setDuration: (duration) => set({ duration }),

  isPlaying: false,
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  isPaused: false,
  setIsPaused: (isPaused) => set({ isPaused }),

  reset: () =>
    set({
      currentSpeech: null,
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      isPaused: false,
    }),
}));
