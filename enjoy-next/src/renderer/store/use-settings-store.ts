import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "../lib/i18n";

type Theme = "light" | "dark" | "system";
type Language = "en" | "zh-CN" | "ja";

const languages: { code: Language; name: string }[] = [
  {
    code: "en",
    name: "English",
  },
  {
    code: "zh-CN",
    name: "中文",
  },
];

type SettingsState = {
  language: Language;
  languages: { code: Language; name: string }[];
  theme: Theme;
  fontSize: number;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: "zh-CN",
      languages,
      theme: "system",
      fontSize: 16,

      setLanguage: (language) => {
        set({ language });
        i18n.changeLanguage(language);
      },
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),

      // Actions
      refresh: async () => {},
    }),
    {
      name: "settings",
    }
  )
);
