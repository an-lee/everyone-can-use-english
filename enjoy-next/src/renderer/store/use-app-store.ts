import { create } from "zustand";

type AppState = {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  currentView: string;
  setCurrentView: (view: string) => void;

  webApiUrl: string;

  appearance: {
    theme: string;
    fontSize: number;
    language: string;
  };
  setAppearance: (appearance: Partial<AppState["appearance"]>) => Promise<void>;

  libraryPath: string | null;
  fetchConfig: () => Promise<void>;
};

export const useAppStore = create<AppState>()((set, get) => ({
  isLoading: true,
  webApiUrl: "",
  currentView: "home",
  currentUser: null,
  appearance: {
    theme: "system",
    fontSize: 16,
    language: "zh-CN",
  },
  libraryPath: null,

  // State setters
  setLoading: (loading) => set({ isLoading: loading }),
  setCurrentView: (view) => set({ currentView: view }),

  // Actions
  setAppearance: async (appearance) => {
    set({ appearance: { ...get().appearance, ...appearance } });
    if (window.EnjoyAPI) {
      await window.EnjoyAPI.appConfig.set("appearance", get().appearance);
    }
  },

  fetchConfig: async () => {
    set({ isLoading: true });
    if (window.EnjoyAPI) {
      try {
        // Fetch webApiUrl
        const webApiUrl = await window.EnjoyAPI.appConfig.get("webApiUrl");

        // Fetch appearance settings
        const appearance = await window.EnjoyAPI.appConfig.get("appearance");

        // Fetch library path
        const libraryPath = await window.EnjoyAPI.appConfig.libraryPath();

        set({
          appearance: { ...get().appearance, ...appearance },
          libraryPath,
          webApiUrl,
        });
      } catch (error) {
        console.error("Failed to fetch config from main process:", error);
      } finally {
        set({ isLoading: false });
      }
    }
  },
}));

// Initialize the store by fetching config from main process
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    useAppStore.getState().fetchConfig();
  });
}
