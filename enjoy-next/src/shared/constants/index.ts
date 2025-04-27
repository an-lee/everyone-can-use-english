import { GPT_PROVIDERS } from "./gpt-providers";
import { IPA_MAPPINGS } from "./ipa";
import { APPEARANCE_LANGUAGES } from "./languages";
import { TTS_PROVIDERS } from "./tts-providers";

export * from "./ipa";
export * from "./gpt-providers";
export * from "./tts-providers";
export * from "./languages";

export const DATABASE_NAME = "enjoy_database";
export const LIBRARY_PATH_SUFFIX = "EnjoyLibrary";
export const STORAGE_WORKER_ENDPOINT = "https://storage.enjoy.bot";
export const WEB_API_URL = "https://enjoy.bot";
export const WS_URL = "wss://enjoy.bot";
export const DISCUSS_URL = "https://discuss.enjoy.bot";
export const REPO_URL =
  "https://github.com/zuodaotech/everyone-can-use-english";

export const USER_DATA_SUB_PATH = [
  "audios",
  "documents",
  "recordings",
  "segments",
  "speeches",
  "videos",
];

export const MIME_TYPES: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
  ".wma": "audio/x-ms-wma",
};

export const NULL_UUID = "00000000-0000-0000-0000-000000000000";

export const DEFAULT_USER_SETTINGS = {
  language: "zh-CN",
  languages: APPEARANCE_LANGUAGES,
  theme: "system" as Theme,
  fontSize: 16,
  nativeLanguage: "zh-CN",
  learningLanguage: "en-US",
  whisper: "azure",
  gptEngine: {
    name: "enjoyai",
    models: {
      default: "gpt-4o",
    },
  },
  gptProviders: GPT_PROVIDERS,
  ttsProviders: TTS_PROVIDERS,
  openai: {
    baseUrl: "",
    key: "",
    models: "",
  },
  // 'local', 'enjoy_azure', 'enjoy_cloudflare', 'openai'
  sttEngine: "enjoy_azure",
  ttsConfig: {
    engine: "enjoyai",
    language: "en-US",
    model: "azure/speech",
    voice: "en-US-JennyNeural",
  } as TTSConfig,
  // 'whisper', 'whisperCpp'
  echogarden: {
    engine: "whisper" as "whisper" | "whisperCpp",
    whisper: {},
    whisperCpp: {},
  },
  recorderConfig: {
    autoGainControl: false,
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 16000,
    sampleSize: 16,
  },
  hotkeys: {},
  ipaMappings: IPA_MAPPINGS,
  profile: null,
  latestVersion: "",
};
