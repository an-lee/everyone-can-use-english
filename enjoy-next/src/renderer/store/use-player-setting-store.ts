import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type PlayMode = "shadowMode" | "readMode";
type FrequencyAlgorithm = "YIN" | "AMDF" | "ACF2PLUS";
type FrequencyFilterType = "basic" | "language" | "tonal" | "speech";

type MediaPlayerSettingState = {
  looping: boolean;
  setLooping: (looping: boolean) => void;

  playMode: PlayMode;
  setPlayMode: (playMode: PlayMode) => void;

  displayPitchContour: boolean;
  setDisplayPitchContour: (displayPitchContour: boolean) => void;

  displayTranslation: boolean;
  setDisplayTranslation: (displayTranslation: boolean) => void;

  frequencyAlgorithm: FrequencyAlgorithm;
  setFrequencyAlgorithm: (frequencyAlgorithm: FrequencyAlgorithm) => void;

  frequencyFilterType: FrequencyFilterType;
  setFrequencyFilterType: (frequencyFilterType: FrequencyFilterType) => void;
};

export const usePlayerSettingStore = create<MediaPlayerSettingState>()(
  persist(
    (set) => ({
      looping: false,
      setLooping: (looping: boolean) => set({ looping }),

      playMode: "shadowMode",
      setPlayMode: (playMode: PlayMode) => set({ playMode }),

      displayPitchContour: false,
      setDisplayPitchContour: (displayPitchContour: boolean) =>
        set({ displayPitchContour }),

      displayTranslation: false,
      setDisplayTranslation: (displayTranslation: boolean) =>
        set({ displayTranslation }),

      frequencyAlgorithm: "AMDF",
      setFrequencyAlgorithm: (frequencyAlgorithm: FrequencyAlgorithm) =>
        set({ frequencyAlgorithm }),

      frequencyFilterType: "speech",
      setFrequencyFilterType: (frequencyFilterType: FrequencyFilterType) =>
        set({ frequencyFilterType }),
    }),
    {
      name: "media-player-setting",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
