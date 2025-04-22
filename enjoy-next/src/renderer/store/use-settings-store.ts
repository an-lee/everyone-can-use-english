import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "../lib/i18n";

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
  theme: Theme;
  setTheme: (theme: Theme) => void;

  fontSize: number;
  setFontSize: (size: number) => void;

  languages: { code: Language; name: string }[];
  language: Language;
  setLanguage: (language: Language) => void;

  nativeLanguage: string;
  learningLanguage: string;
  setNativeLanguage: (language: string) => void;
  setLearningLanguage: (language: string) => void;

  whisper: string;
  setWhisper: (whisper: string) => void;

  openai: {
    baseUrl: string;
    key: string;
    models: string;
  };
  setOpenai: (openai: { baseUrl: string; key: string; models: string }) => void;

  gptEngine: {
    name: string;
    models: {
      [key: string]: string;
    };
  };
  setGptEngine: (gptEngine: {
    name: string;
    models: { [key: string]: string };
  }) => void;

  sttEngine: string;
  setSttEngine: (sttEngine: string) => void;

  ttsConfig: {
    engine: string;
    language: string;
    model: string;
    voice: string;
  };
  setTtsConfig: (ttsConfig: {
    engine: string;
    language: string;
    model: string;
    voice: string;
  }) => void;

  echogarden: {
    engine: "whisper" | "whisperCpp";
    whisper?: { [key: string]: string };
    whisperCpp?: { [key: string]: string };
  };
  setEchogarden: (echogarden: {
    engine: "whisper" | "whisperCpp";
    whisper?: { [key: string]: string };
    whisperCpp?: { [key: string]: string };
  }) => void;

  hotkeys: {
    [key: string]: string;
  };
  setHotkeys: (hotkeys: { [key: string]: string }) => void;

  recorderConfig: {
    [key: string]: string;
  };
  setRecorderConfig: (recorderConfig: { [key: string]: string }) => void;

  refresh: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: "zh-CN",
      languages,
      setLanguage: (language) => {
        set({ language });
        i18n.changeLanguage(language);
        window.EnjoyAPI.db.userSetting.set("language", language);
      },

      theme: "system",
      setTheme: (theme) => {
        set({ theme });
        window.EnjoyAPI.db.userSetting.set("theme", theme);
      },

      fontSize: 16,
      setFontSize: (fontSize) => {
        set({ fontSize });
        window.EnjoyAPI.db.userSetting.set("fontSize", fontSize);
      },

      nativeLanguage: "zh-CN",
      learningLanguage: "en-US",
      setNativeLanguage: (nativeLanguage) => {
        set({ nativeLanguage });
        window.EnjoyAPI.db.userSetting.set("nativeLanguage", nativeLanguage);
      },
      setLearningLanguage: (learningLanguage) => {
        set({ learningLanguage });
        window.EnjoyAPI.db.userSetting.set(
          "learningLanguage",
          learningLanguage
        );
      },

      whisper: "azure",
      setWhisper: (whisper) => {
        set({ whisper });
        window.EnjoyAPI.db.userSetting.set("whisper", whisper);
      },

      openai: {
        baseUrl: "",
        key: "",
        models: "",
      },
      setOpenai: (openai) => {
        set({ openai });
        window.EnjoyAPI.db.userSetting.set("openai", openai);
      },

      gptEngine: {
        name: "",
        models: {},
      },
      setGptEngine: (gptEngine) => {
        set({ gptEngine });
        window.EnjoyAPI.db.userSetting.set("gptEngine", gptEngine);
      },

      sttEngine: "",
      setSttEngine: (sttEngine) => {
        set({ sttEngine });
        window.EnjoyAPI.db.userSetting.set("sttEngine", sttEngine);
      },

      ttsConfig: {
        engine: "",
        language: "",
        model: "",
        voice: "",
      },
      setTtsConfig: (ttsConfig) => {
        set({ ttsConfig });
        window.EnjoyAPI.db.userSetting.set("ttsConfig", ttsConfig);
      },

      echogarden: {
        engine: "whisper",
        whisper: {},
        whisperCpp: {},
      },
      setEchogarden: (echogarden) => {
        set({ echogarden });
        window.EnjoyAPI.db.userSetting.set("echogarden", echogarden);
      },

      hotkeys: {},
      setHotkeys: (hotkeys) => {
        set({ hotkeys });
        window.EnjoyAPI.db.userSetting.set("hotkeys", hotkeys);
      },

      recorderConfig: {},
      setRecorderConfig: (recorderConfig) => {
        set({ recorderConfig });
        window.EnjoyAPI.db.userSetting.set("recorderConfig", recorderConfig);
      },

      // Actions
      refresh: async () => {
        window.EnjoyAPI.db.userSetting.all().then((settings) => {
          console.log("settings refreshed:", settings);
          for (const setting of settings) {
            switch (setting.key) {
              case "language":
                get().setLanguage(setting.value);
                break;
              case "theme":
                get().setTheme(setting.value);
                break;
              case "fontSize":
                get().setFontSize(setting.value);
                break;
              case "nativeLanguage":
                get().setNativeLanguage(setting.value);
                break;
              case "learningLanguage":
                get().setLearningLanguage(setting.value);
                break;
              case "whisper":
                get().setWhisper(setting.value);
                break;
              case "openai":
                get().setOpenai(setting.value);
                break;
              case "gptEngine":
                get().setGptEngine(setting.value);
                break;
              case "sttEngine":
                get().setSttEngine(setting.value);
                break;
              case "ttsConfig":
                get().setTtsConfig(setting.value);
                break;
              case "echogarden":
                get().setEchogarden(setting.value);
                break;
              case "hotkeys":
                get().setHotkeys(setting.value);
                break;
              case "recorder":
                get().setRecorderConfig(setting.value);
                break;
            }
          }
        });
      },
    }),
    {
      name: "settings",
    }
  )
);
