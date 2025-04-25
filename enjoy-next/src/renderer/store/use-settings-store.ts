import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "../lib/i18n";
import { Client } from "../api";
import {
  GPT_PROVIDERS,
  TTS_PROVIDERS,
  APPEARANCE_LANGUAGES,
} from "@/shared/constants";

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
    [key: string]: string;
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
      language: "zh-CN",
      languages: APPEARANCE_LANGUAGES,
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

      gptProviders: GPT_PROVIDERS,
      setGptProviders: (gptProviders) => {
        set({ gptProviders });
      },

      ttsProviders: TTS_PROVIDERS,
      setTtsProviders: (ttsProviders) => {
        set({ ttsProviders });
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
        engine: "enjoyai",
        language: "en-US",
        model: "azure/speech",
        voice: "en-US-JennyNeural",
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

      ipaMappings: {},
      latestVersion: "",

      // Actions
      refresh: async () => {
        get().refreshFromIpc();
        get().refreshFromAPI();
      },

      refreshFromIpc: async () => {
        window.EnjoyAPI.db.userSetting.all().then((settings) => {
          for (const setting of settings) {
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
                set({ openai: setting.value });
                break;
              case "gptEngine":
                set({ gptEngine: setting.value });
                break;
              case "sttEngine":
                set({ sttEngine: setting.value });
                break;
              case "ttsConfig":
                if (setting.value) {
                  set({
                    ttsConfig: {
                      ...get().ttsConfig,
                      ...setting.value,
                    },
                  });
                }
                break;
              case "echogarden":
                set({ echogarden: setting.value });
                break;
              case "hotkeys":
                set({ hotkeys: setting.value });
                break;
              case "recorder":
                set({ recorderConfig: setting.value });
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
