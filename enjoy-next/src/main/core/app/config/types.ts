import { UserType } from "@renderer/api";

// Config type definitions
export interface ProxyConfig {
  enabled: boolean;
  url?: string;
}

export interface AppConfigState {
  libraryPath: string;
  webApiUrl: string;
  wsUrl: string;
  proxy: ProxyConfig;
  user: UserType | null;
  sessions: UserType[];
}

export const APP_CONFIG_SCHEMA = {
  libraryPath: {
    type: "string",
    default: process.env.LIBRARY_PATH || "", // Will be set in store.ts with proper path
  },
  webApiUrl: { type: "string", default: "" }, // Will be set in store.ts
  wsUrl: { type: "string", default: "" }, // Will be set in store.ts
  proxy: {
    type: "object",
    properties: {
      enabled: { type: "boolean", default: false },
      url: { type: "string" },
    },
  },
  user: {
    type: "object",
    properties: {
      id: { type: "number" },
      name: { type: "string" },
      avatarUrl: { type: "string" },
      accessToken: { type: "string" },
    },
  },
  sessions: {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "number" },
        name: { type: "string" },
        avatarUrl: { type: "string" },
        accessToken: { type: "string" },
      },
    },
    default: [],
  },
};
