import { create } from "zustand";

type MediaTranscriptionState = {
  targetId: string;
  setTargetId: (targetId: string) => void;

  targetType: "Audio" | "Video" | "ChatMessage" | "None";
  setTargetType: (
    targetType: "Audio" | "Video" | "ChatMessage" | "None"
  ) => void;

  currentTime: number;
  setCurrentTime: (currentTime: number) => void;

  currentIndex: number;
  setCurrentIndex: (currentIndex: number) => void;

  sentences: TimelineEntry[];
  setSentences: (sentences: TimelineEntry[]) => void;

  selectedWords: number[];
  setSelectedWords: (selectedWords: number[]) => void;

  previousSentence: () => TimelineEntry | null;
  nextSentence: () => TimelineEntry | null;

  reset: () => void;
};

export const useTranscriptionStore = create<MediaTranscriptionState>(
  (set, get) => ({
    targetId: "",
    setTargetId: (targetId) => set({ targetId }),

    targetType: "None",
    setTargetType: (targetType) => set({ targetType }),

    currentTime: 0,
    setCurrentTime: (currentTime) => set({ currentTime }),

    currentIndex: 0,
    setCurrentIndex: (currentIndex) => set({ currentIndex }),

    sentences: [],
    setSentences: (sentences) => set({ sentences }),

    selectedWords: [],
    setSelectedWords: (selectedWords) => set({ selectedWords }),

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

    reset: () => {
      set({ currentTime: 0, currentIndex: 0, sentences: [] });
    },
  })
);
