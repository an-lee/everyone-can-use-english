// Config type definitions
declare interface ProxyConfig {
  enabled: boolean;
  url?: string;
}

declare interface AppConfigState {
  libraryPath: string;
  webApiUrl: string;
  wsUrl: string;
  proxy: ProxyConfig;
  user: UserType | null;
  sessions: UserType[];
}
