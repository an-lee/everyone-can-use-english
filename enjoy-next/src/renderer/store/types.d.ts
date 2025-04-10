// App initialization types
declare interface InitializationProgress {
  step: string;
  progress: number;
  message: string;
}

// App state machine types
declare type AppStateType =
  | { status: "initializing"; progress: InitializationProgress }
  | {
      status: "initializing_error";
      error: string;
      progress: InitializationProgress;
    }
  | { status: "login" }
  | { status: "ready" };

declare interface AppState {
  // Config state
  config: Partial<AppConfigState> & { version: string };
  configLoaded: boolean;

  // App state
  appState: AppStateType;

  // Actions - Config
  loadConfig: () => Promise<void>;

  // Actions - State transitions
  setInitializing: (progress: InitializationProgress) => void;
  setInitializationError: (
    error: string,
    progress: InitializationProgress
  ) => void;
  setLoginRequired: () => void;
  setReady: () => void;

  // Complex actions
  handleInitProgress: (
    progress: InitializationProgress & { error: string | null }
  ) => void;
  checkAuthAndUpdateState: () => Promise<void>;
}

declare type LoginMethodType =
  | "google_oauth2"
  | "github"
  | "mixin"
  | "email"
  | "phone"
  | null;

declare type AuthState = {
  isAuthenticated: () => boolean;
  currentUser: UserType | null;
  sessions: UserType[];

  nonce: string | null;
  logingMethod: LoginMethodType;

  // Actions
  setLogingMethod: (logingMethod: LoginMethodType) => void;
  autoLogin: () => Promise<void>;
  generateNonce: () => string;
  login: (currentUser: UserType) => void;
  logout: () => void;
  fetchSessions: () => Promise<void>;
};

declare type DbStore = {
  // State
  dbState: DbState;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getStatus: () => Promise<void>;
  resetState: () => void;
  checkAndConnectIfNeeded: () => Promise<void>;

  // Helper methods
  shouldManuallyConnect: (dbState: DbState) => boolean;
  getConnectionStatusReason: (dbState: DbState) => string;
};

declare type Theme = "light" | "dark" | "system";
declare type Language = "en" | "zh-CN" | "ja";
