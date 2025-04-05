import { create } from "zustand";
import { Client } from "@renderer/api/client";

type Theme = "light" | "dark" | "system";

type SettingsState = {
  theme: Theme;
  fontSize: number;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
};

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  theme: "system",
  fontSize: 16,

  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),

  // Actions
  refresh: async () => {
    const api = new Client();

    if (window.EnjoyAPI) {
      const settings = await window.EnjoyAPI.appConfig.get("settings");
    }
  },
}));
