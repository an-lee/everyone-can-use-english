export * from "./ipa";

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
