import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "../lib/i18n";
import { Client } from "../api";
import {
  DEFAULT_USER_SETTINGS,
  GPT_PROVIDERS,
  TTS_PROVIDERS,
} from "@shared/constants";
import { useAppStore } from "./use-app-store";
import useAuthStore from "./use-auth-store";

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
  currentGptEngine: () => {
    key: string;
    baseUrl?: string;
    models: { [key: string]: string };
  };

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
        window.EnjoyAPI.db.userSetting.set("font_size", fontSize);
      },

      setNativeLanguage: (nativeLanguage) => {
        set({ nativeLanguage });
        window.EnjoyAPI.db.userSetting.set("native_language", nativeLanguage);
      },
      setLearningLanguage: (learningLanguage) => {
        set({ learningLanguage });
        window.EnjoyAPI.db.userSetting.set(
          "learning_language",
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
        window.EnjoyAPI.db.userSetting.set("gpt_engine", gptEngine);
      },

      currentGptEngine: () => {
        const { gptEngine, openai } = get();
        const appConfig = useAppStore.getState().config;
        const currentUser = useAuthStore.getState().currentUser;

        if (gptEngine.name === "openai" && openai.key) {
          return {
            key: openai.key,
            baseUrl: openai.baseUrl,
            models: gptEngine.models,
          };
        }
        return {
          key: currentUser?.accessToken || "",
          baseUrl: appConfig.webApiUrl,
          models: gptEngine.models,
        };
      },

      setSttEngine: (sttEngine) => {
        set({ sttEngine });
        window.EnjoyAPI.db.userSetting.set("stt_engine", sttEngine);
      },

      setTtsConfig: (ttsConfig) => {
        set({ ttsConfig });
        window.EnjoyAPI.db.userSetting.set("tts_config", ttsConfig);
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
        window.EnjoyAPI.db.userSetting.set("recorder", recorderConfig);
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
              case "font_size":
                set({ fontSize: setting.value });
                break;
              case "native_language":
                set({ nativeLanguage: setting.value });
                break;
              case "learning_language":
                set({ learningLanguage: setting.value });
                break;
              case "whisper":
                set({ whisper: setting.value });
                break;
              case "openai":
                set({ openai: { ...get().openai, ...setting.value } });
                break;
              case "gpt_engine":
                set({
                  gptEngine: {
                    ...get().gptEngine,
                    ...setting.value,
                  },
                });
                break;
              case "stt_engine":
                set({ sttEngine: setting.value });
                break;
              case "tts_config":
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
