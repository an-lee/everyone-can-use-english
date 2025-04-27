import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "../lib/i18n";
import { Client } from "../api";
import {
  DEFAULT_USER_SETTINGS,
  GPT_PROVIDERS,
  TTS_PROVIDERS,
} from "@shared/constants";

type SettingsState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;

  fontSize: number;
  setFontSize: (size: number) => void;

  languages: { code: string; name: string }[];
  language: string;
  setLanguage: (language: string) => void;

  nativeLanguage: string;
  learningLanguage: string;
  setNativeLanguage: (language: string) => void;
  setLearningLanguage: (language: string) => void;

  whisper: string;
  setWhisper: (whisper: string) => void;

  gptProviders: {
    [key: string]: {
      name: string;
      models: string[];
    };
  };
  setGptProviders: (gptProviders: {
    [key: string]: { name: string; models: string[] };
  }) => void;

  ttsProviders: {
    [key: string]: {
      name: string;
      models: string[];
      voices: {
        label: string;
        value: string;
        provider: string;
        language?: string;
      }[];
    };
  };
  setTtsProviders: (ttsProviders: {
    [key: string]: {
      name: string;
      models: string[];
      voices: {
        label: string;
        value: string;
        provider: string;
        language?: string;
      }[];
    };
  }) => void;

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

  ttsConfig: TTSConfig;
  setTtsConfig: (ttsConfig: TTSConfig) => void;

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
    [key: string]: any;
  };
  setRecorderConfig: (recorderConfig: { [key: string]: string }) => void;

  // Remote config
  ipaMappings: {
    [key: string]: string;
  };
  latestVersion: string;

  refresh: () => void;
  refreshFromIpc: () => void;
  refreshFromAPI: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_USER_SETTINGS,
      setLanguage: (language) => {
        set({ language });
        i18n.changeLanguage(language);
        window.EnjoyAPI.db.userSetting.set("language", language);
      },

      setTheme: (theme) => {
        set({ theme });
        window.EnjoyAPI.db.userSetting.set("theme", theme);
      },

      setFontSize: (fontSize) => {
        set({ fontSize });
        window.EnjoyAPI.db.userSetting.set("fontSize", fontSize);
      },

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

      setWhisper: (whisper) => {
        set({ whisper });
        window.EnjoyAPI.db.userSetting.set("whisper", whisper);
      },

      setGptProviders: (gptProviders) => {
        set({ gptProviders });
      },

      setTtsProviders: (ttsProviders) => {
        set({ ttsProviders });
      },

      setOpenai: (openai) => {
        set({ openai });
        window.EnjoyAPI.db.userSetting.set("openai", openai);
      },

      setGptEngine: (gptEngine) => {
        set({ gptEngine });
        window.EnjoyAPI.db.userSetting.set("gptEngine", gptEngine);
      },

      setSttEngine: (sttEngine) => {
        set({ sttEngine });
        window.EnjoyAPI.db.userSetting.set("sttEngine", sttEngine);
      },

      setTtsConfig: (ttsConfig) => {
        set({ ttsConfig });
        window.EnjoyAPI.db.userSetting.set("ttsConfig", ttsConfig);
      },

      setEchogarden: (echogarden) => {
        set({ echogarden });
        window.EnjoyAPI.db.userSetting.set("echogarden", echogarden);
      },

      setHotkeys: (hotkeys) => {
        set({ hotkeys });
        window.EnjoyAPI.db.userSetting.set("hotkeys", hotkeys);
      },

      setRecorderConfig: (recorderConfig) => {
        set({ recorderConfig });
        window.EnjoyAPI.db.userSetting.set("recorderConfig", recorderConfig);
      },

      // Actions
      refresh: async () => {
        get().refreshFromIpc();
        get().refreshFromAPI();
      },

      refreshFromIpc: async () => {
        window.EnjoyAPI.db.userSetting.all().then((settings) => {
          for (const setting of settings) {
            if (!setting.value) continue;
            switch (setting.key) {
              case "language":
                set({ language: setting.value });
                break;
              case "theme":
                set({ theme: setting.value });
                break;
              case "fontSize":
                set({ fontSize: setting.value });
                break;
              case "nativeLanguage":
                set({ nativeLanguage: setting.value });
                break;
              case "learningLanguage":
                set({ learningLanguage: setting.value });
                break;
              case "whisper":
                set({ whisper: setting.value });
                break;
              case "openai":
                set({ openai: { ...get().openai, ...setting.value } });
                break;
              case "gptEngine":
                set({
                  gptEngine: {
                    ...get().gptEngine,
                    ...setting.value,
                  },
                });
                break;
              case "sttEngine":
                set({ sttEngine: setting.value });
                break;
              case "ttsConfig":
                set({
                  ttsConfig: {
                    ...get().ttsConfig,
                    ...setting.value,
                  },
                });
                break;
              case "echogarden":
                set({
                  echogarden: {
                    ...get().echogarden,
                    ...setting.value,
                  },
                });
                break;
              case "hotkeys":
                set({
                  hotkeys: {
                    ...get().hotkeys,
                    ...setting.value,
                  },
                });
                break;
              case "recorder":
                set({
                  recorderConfig: {
                    ...get().recorderConfig,
                    ...setting.value,
                  },
                });
                break;
            }
          }
        });
      },

      refreshFromAPI: async () => {
        const client = new Client();
        Promise.all([
          client.config("ipa_mappings").then((ipaMappings) => {
            set({ ipaMappings });
          }),
          client.config("app_version").then((appVersion) => {
            set({ latestVersion: appVersion.version });
          }),
          client.config("gpt_providers").then((gptProviders) => {
            set({ gptProviders });
          }),
          client.config("tts_providers").then((ttsProviders) => {
            set({ ttsProviders });
          }),
        ]);
      },
    }),
    {
      name: "settings",
    }
  )
);
