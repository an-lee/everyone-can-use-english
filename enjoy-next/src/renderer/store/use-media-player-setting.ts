import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type MediaPlayerSettingState = {
  looping: boolean;
  setLooping: (looping: boolean) => void;

  playMode: "shadowMode" | "readMode";
  setPlayMode: (playMode: "shadowMode" | "readMode") => void;

  displayPitchContour: boolean;
  setDisplayPitchContour: (displayPitchContour: boolean) => void;

  displayTranslation: boolean;
  setDisplayTranslation: (displayTranslation: boolean) => void;
};

export const useMediaPlayerSetting = create<MediaPlayerSettingState>()(
  persist(
    (set) => ({
      looping: false,
      setLooping: (looping: boolean) => set({ looping }),

      playMode: "shadowMode",
      setPlayMode: (playMode: "shadowMode" | "readMode") => set({ playMode }),

      displayPitchContour: false,
      setDisplayPitchContour: (displayPitchContour: boolean) =>
        set({ displayPitchContour }),

      displayTranslation: false,
      setDisplayTranslation: (displayTranslation: boolean) =>
        set({ displayTranslation }),
    }),
    {
      name: "media-player-setting",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
