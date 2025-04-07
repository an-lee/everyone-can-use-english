import { create } from "zustand";
import { version } from "../../../package.json";
import { useAuthStore } from "./use-auth-store";

export type AppStatusType = "initializing" | "login" | "ready" | "error";

export type InitStatus = {
  currentStep: string;
  progress: number;
  error: string | null;
  message: string;
};

type AppState = {
  // Basic app info
  initialized: boolean;
  version: string;
  webApiUrl: string;
  libraryPath: string | null;
  proxy?: {
    enabled: boolean;
    url: string;
  };

  // App status
  appStatus: AppStatusType;
  initStatus: InitStatus;

  // Actions
  fetchConfig: () => Promise<void>;
  setAppStatus: (status: AppStatusType) => void;
  setInitStatus: (status: InitStatus) => void;
  handleInitStatus: (status: InitStatus) => void;
  checkAuthAndSetStatus: () => Promise<void>;
};

/**
 * App store
 *
 * This store is used to store the app Info and status.
 */
export const useAppStore = create<AppState>()((set, get) => ({
  // Basic app info
  initialized: false,
  version,
  webApiUrl: "",
  libraryPath: null,
  proxy: undefined,

  // App status
  appStatus: "initializing",
  initStatus: {
    currentStep: "starting",
    progress: 0,
    error: null,
    message: "Starting application...",
  },

  // Actions
  fetchConfig: async () => {
    if (window.EnjoyAPI) {
      try {
        // Fetch webApiUrl
        const webApiUrl = await window.EnjoyAPI.appConfig.get("webApiUrl");

        // Fetch library path
        const libraryPath = await window.EnjoyAPI.appConfig.libraryPath();

        // Fetch proxy
        const proxy = await window.EnjoyAPI.appConfig.get("proxy");

        set({
          libraryPath,
          webApiUrl,
          proxy,
        });
        set({ initialized: true });
      } catch (error) {
        console.error("Failed to fetch config from main process:", error);
      }
    }
  },

  setAppStatus: (appStatus: AppStatusType) => {
    set({ appStatus });
  },

  setInitStatus: (initStatus: InitStatus) => {
    set({ initStatus });
  },

  handleInitStatus: (status: InitStatus) => {
    set({ initStatus: status });

    if (status.error) {
      set({ appStatus: "error" });
    } else if (status.currentStep === "ready") {
      // If app is ready, check authentication status
      get().checkAuthAndSetStatus();
    }
  },

  checkAuthAndSetStatus: async () => {
    const { initStatus } = get();
    if (initStatus.currentStep !== "ready") return;

    const { isAuthenticated, autoLogin } = useAuthStore.getState();

    // If auto login was not called yet, call it
    if (!isAuthenticated()) {
      await autoLogin();
    }

    // Set app status based on auth state
    if (isAuthenticated()) {
      set({ appStatus: "ready" });
    } else {
      set({ appStatus: "login" });
    }
  },
}));

// Initialize the store by fetching config from main process
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    useAppStore.getState().fetchConfig();

    // Set up listener for app initialization status
    if (window.EnjoyAPI) {
      window.EnjoyAPI.initializer.getStatus().then((status: InitStatus) => {
        useAppStore.getState().handleInitStatus(status);
      });

      window.EnjoyAPI.events.on("app-init-status", (status: InitStatus) => {
        useAppStore.getState().handleInitStatus(status);
      });
    }

    // Listen for auth state changes
    useAuthStore.subscribe((state, prevState) => {
      // Only run when auth state changes
      if (state.currentUser?.id !== prevState.currentUser?.id) {
        useAppStore.getState().checkAuthAndSetStatus();
      }
    });
  });
}
