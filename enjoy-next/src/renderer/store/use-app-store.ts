import { create } from "zustand";
import { version } from "../../../package.json";
import { useAuthStore } from "./use-auth-store";

/**
 * App store
 *
 * This store handles application configuration and state machine.
 */
export const useAppStore = create<AppState>()((set, get) => ({
  // Config state
  config: {
    version,
    webApiUrl: "",
    libraryPath: "",
  },
  configLoaded: false,

  // Initial app state
  appState: {
    status: "initializing",
    progress: {
      step: "starting",
      progress: 0,
      message: "Starting application...",
    },
  },

  // Actions - Config
  loadConfig: async () => {
    if (window.EnjoyAPI) {
      try {
        // Fetch webApiUrl
        const webApiUrl = await window.EnjoyAPI.appConfig.get("webApiUrl");

        // Fetch library path
        const libraryPath = await window.EnjoyAPI.appConfig.libraryPath();

        // Fetch proxy
        const proxy = await window.EnjoyAPI.appConfig.get("proxy");

        set({
          config: {
            version,
            webApiUrl,
            libraryPath,
            proxy,
          },
          configLoaded: true,
        });
      } catch (error) {
        console.error("Failed to fetch config from main process:", error);

        // Create default progress
        const defaultProgress = {
          step: "config",
          progress: 0,
          message: "Loading configuration...",
        };

        // Get current state and handle differently based on type
        const currentState = get().appState;

        if (
          currentState.status === "initializing" ||
          currentState.status === "initialization_error"
        ) {
          // We already have progress data in these states
          set({
            appState: {
              status: "initialization_error",
              error: "Failed to load application configuration",
              progress: currentState.progress,
            },
          });
        } else {
          // Other states don't have progress, use default
          set({
            appState: {
              status: "initialization_error",
              error: "Failed to load application configuration",
              progress: defaultProgress,
            },
          });
        }
      }
    }
  },

  // State machine transitions
  setInitializing: (progress) => {
    set({ appState: { status: "initializing", progress } });
  },

  setInitializationError: (error, progress) => {
    set({ appState: { status: "initialization_error", error, progress } });
  },

  setLoginRequired: () => {
    set({ appState: { status: "login" } });
  },

  setReady: () => {
    set({ appState: { status: "ready" } });
  },

  // Complex actions
  handleInitProgress: (data) => {
    const { error, ...progress } = data;

    if (error) {
      get().setInitializationError(error, progress);
    } else if (progress.step === "ready") {
      // If initialization is complete, check authentication
      get().checkAuthAndUpdateState();
    } else {
      get().setInitializing(progress);
    }
  },

  checkAuthAndUpdateState: async () => {
    const { isAuthenticated, autoLogin } = useAuthStore.getState();

    // If user is not logged in, try auto-login
    if (!isAuthenticated()) {
      await autoLogin();
    }

    // Set app state based on authentication status
    if (isAuthenticated()) {
      get().setReady();
    } else {
      get().setLoginRequired();
    }
  },
}));

// Initialize the store
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    // Load app configuration
    useAppStore.getState().loadConfig();

    // Set up listener for initialization status
    if (window.EnjoyAPI) {
      window.EnjoyAPI.appInitializer.status().then((status: any) => {
        useAppStore.getState().handleInitProgress({
          step: status.currentStep,
          progress: status.progress,
          message: status.message,
          error: status.error,
        });
      });

      window.EnjoyAPI.events.on("appInitializer:status", (status: any) => {
        useAppStore.getState().handleInitProgress({
          step: status.currentStep,
          progress: status.progress,
          message: status.message,
          error: status.error,
        });
      });
    }

    // Listen for auth state changes
    useAuthStore.subscribe((state, prevState) => {
      // Only run when auth state changes
      if (state.currentUser?.id !== prevState.currentUser?.id) {
        const { appState, checkAuthAndUpdateState } = useAppStore.getState();

        // Only update state if we're in login state or ready state
        if (appState.status === "login" || appState.status === "ready") {
          checkAuthAndUpdateState();
        }
      }
    });
  });
}
