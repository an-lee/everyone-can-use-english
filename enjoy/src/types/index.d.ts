// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Vite
// plugin that tells the Electron app where to look for the Vite-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;
declare module "foliate-js/view.js";
declare module "foliate-js/epub.js";
declare module "compromise-paragraphs";

declare module "segment" {
  class Segment {
    useDefault(): void;
    loadDict(path: string): void;
    doSegment(
      text: string,
      options: { stripPunctuation: boolean }
    ): Array<{ w: string }>;
  }
  export = Segment;
}

type SupportedLlmProviderType = "enjoyai" | "openai";

type LlmProviderType = {
  name?: "enjoyai" | "openai";
  key?: string;
  model?: string;
  baseUrl?: string;
  models?: string;
};

type DownloadStateType = {
  name: string;
  isPaused: boolean;
  canResume: boolean;
  state: "progressing" | "interrupted" | "completed" | "cancelled";
  received: number;
  total: number;
  speed?: string;
};

type DecompressTask = {
  id: string;
  type: string;
  title: string;
  filePath: string;
  destPath: string;
  progress?: string;
};

type NotificationType = {
  type: "info" | "error" | "warning" | "success";
  message: string;
};

type WhisperConfigType = {
  // service: "local" | "azure" | "cloudflare" | "openai";
  availableModels: {
    type: string;
    name: string;
    size: string;
    url: string;
    savePath: string;
  }[];
  modelsPath: string;
  model: string;
  ready?: boolean;
};

type WhisperOutputType = {
  engine?: string;
  model: {
    audio?: {
      cts: number;
      head: number;
      layer: number;
      state: number;
    };
    ftype?: number;
    mels?: number;
    multilingual?: number;
    text?: {
      cts: number;
      head: number;
      layer: number;
      state: number;
    };
    type: string;
    vocab?: number;
  };
  params: {
    language: string;
    model: string;
    translate: boolean;
  };
  result: {
    language: string;
  };
  systeminfo: string;
  transcription: TranscriptionResultSegmentType[];
};

type CfWhipserOutputType = {
  text: string;
  vtt: string;
  words_count: number;
  words: {
    word: string;
    start: number;
    end: number;
  }[];
};

type TransactionStateType = {
  model: string;
  id: string;
  action: "create" | "update" | "destroy";
  record?: AudioType | UserType | RecordingType;
};

type LookupType = {
  id: string;
  word: string;
  context: string;
  contextTranslation: string;
  status?: "pending" | "completed" | "failed";
  meaning?: MeaningType;
  meaningOptions?: MeaningType[];
  createdAt: string;
  updatedAt: string;
};

type MeaningType = {
  id: string;
  word: string;
  lemma?: string;
  pronunciation?: string;
  pos?: string;
  definition: string;
  translation: string;
  lookups: LookupType[];
};

type PagyResponseType = {
  page: number;
  next: number | null;
  last: number;
};

type AudibleBookType = {
  title: string;
  subtitle: string;
  author: string;
  narrator: string;
  cover?: string;
  language?: string;
  sample?: string;
  url: string;
};

type TedTalkType = {
  title: string;
  presenterDisplayName: string;
  slug: string;
  canonicalUrl: string;
  duration: string;
  publishedAt: string;
  primaryImageSet: {
    url: string;
    aspectRatioName: string;
  }[];
};

type TedIdeaType = {
  url: string;
  cover?: string;
  title: string;
  description: string;
};

type ProxyConfigType = {
  enabled: boolean;
  url: string;
};

type VocabularyConfigType = {
  lookupOnMouseOver: boolean;
};

type YoutubeVideoType = {
  title: string;
  thumbnail: string;
  videoId: string;
  duration: string;
};

type GptEngineSettingType = {
  name: string;
  models: {
    default: string;
    lookup?: string;
    translate?: string;
    analyze?: string;
    extractStory?: string;
  };
  baseUrl?: string;
  key?: string;
};

type TtsEngineSettingType = {
  name: string;
  model: string;
  voice: string;
  language?: string;
  baseUrl?: string;
  key?: string;
};

type PlatformInfo = {
  platform: string;
  arch: string;
  version: string;
};

type DiskUsageType = {
  name: string;
  path: string;
  size: number;
}[];

type RecorderConfigType = {
  autoGainControl: boolean;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  sampleRate: number;
  sampleSize: number;
};

type DictType = "dict" | "mdict" | "preset";

type DictItem = {
  type: DictType;
  text: string;
  value: string;
};

type DictSettingType = {
  default: string;
  removing: string[];
  mdicts: MDict[];
};

type TranscribeParamsType = {
  mediaSrc: string | Blob;
  params?: {
    targetId?: string;
    targetType?: string;
    originalText?: string;
    language: string;
    service: SttEngineOptionEnum | "upload";
    isolate?: boolean;
    align?: boolean;
  };
};

type TranscribeResultType = {
  engine: string;
  model: string;
  transcript: string;
  timeline: TimelineEntry[];
  originalText?: string;
  tokenId?: number;
  url: string;
};

type EchogardenSttConfigType = {
  engine: "whisper" | "whisper.cpp";
  whisper: {
    model: string;
    temperature?: number;
    prompt?: string;
    encoderProvider?: "cpu" | "dml" | "cuda";
    decoderProvider?: "cpu" | "dml" | "cuda";
  };
  whisperCpp?: {
    model: string;
    temperature?: number;
    prompt?: string;
    enableGPU?: boolean;
  };
};
