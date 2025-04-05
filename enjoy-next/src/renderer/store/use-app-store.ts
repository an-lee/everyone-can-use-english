import { create } from "zustand";
import { version } from "../../../package.json";

type AppState = {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  version: string;
  webApiUrl: string;
  libraryPath: string | null;
  proxy?: {
    enabled: boolean;
    url: string;
  };
  fetchConfig: () => Promise<void>;
};

/**
 * App store
 *
 * This store is used to store the app Info.
 */
export const useAppStore = create<AppState>()((set, get) => ({
  isLoading: true,
  version,
  webApiUrl: "",
  libraryPath: null,
  proxy: undefined,

  // State setters
  setLoading: (loading) => set({ isLoading: loading }),

  fetchConfig: async () => {
    set({ isLoading: true });
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
