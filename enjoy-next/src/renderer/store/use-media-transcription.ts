import { create } from "zustand";

type MediaTranscriptionState = {
  currentTime: number;
  setCurrentTime: (currentTime: number) => void;

  currentIndex: number;
  setCurrentIndex: (currentIndex: number) => void;

  sentences: TimelineEntry[];
  setSentences: (sentences: TimelineEntry[]) => void;

  previousSentence: () => TimelineEntry | null;
  nextSentence: () => TimelineEntry | null;
};

export const useMediaTranscription = create<MediaTranscriptionState>(
  (set, get) => ({
    currentTime: 0,
    setCurrentTime: (currentTime) => set({ currentTime }),

    currentIndex: 0,
    setCurrentIndex: (currentIndex) => set({ currentIndex }),

    sentences: [],
    setSentences: (sentences) => set({ sentences }),

    previousSentence: () => {
      const { currentIndex, sentences } = get();
      if (currentIndex <= 0) {
        return null;
      }
      return sentences[currentIndex - 1];
    },
    nextSentence: () => {
      const { currentIndex, sentences } = get();
      if (currentIndex >= sentences.length - 1) {
        return null;
      }
      return sentences[currentIndex + 1];
    },
  })
);
