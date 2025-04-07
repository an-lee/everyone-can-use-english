import { create } from "zustand";
import { useAppStore } from "./use-app-store";
import { useAuthStore } from "./use-auth-store";

// Define the types
type DbConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "locked"
  | "reconnecting";

interface DbState {
  state: DbConnectionState;
  path: string | null;
  error: string | null;
  autoConnected?: boolean;
  retryCount?: number;
  retryDelay?: number;
  lastOperation?: string;
  connectionTime?: number;
  stats?: {
    connectionDuration?: number;
    operationCount?: number;
    lastError?: {
      message: string;
      time: number;
    } | null;
  };
}

type DbStore = {
  // State
  dbState: DbState;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getStatus: () => Promise<void>;
  resetState: () => void;
  checkAndConnectIfNeeded: () => Promise<void>;
};

// Maximum retry attempts for database connection
const MAX_RETRIES = 5;

/**
 * Database store
 *
 * This store is used to manage database connection state and operations.
 */
export const useDbStore = create<DbStore>()((set, get) => ({
  // Initial state
  dbState: {
    state: "disconnected",
    path: null,
    error: null,
  },

  // Actions
  connect: async () => {
    if (!window.EnjoyAPI) return;

    try {
      await window.EnjoyAPI.db.connect();
      // The state will be updated by the event listener
    } catch (error) {
      console.error("Failed to connect to database:", error);
      // Get the latest status after connection attempt
      await get().getStatus();
    }
  },

  disconnect: async () => {
    if (!window.EnjoyAPI) return;

    try {
      await window.EnjoyAPI.db.disconnect();
      // The state will be updated by the event listener
    } catch (error) {
      console.error("Failed to disconnect from database:", error);
      // Get the latest status after disconnection attempt
      await get().getStatus();
    }
  },

  getStatus: async () => {
    if (!window.EnjoyAPI) return;

    try {
      const status = await window.EnjoyAPI.db.status();
      set({ dbState: status });
    } catch (error) {
      console.error("Failed to get database status:", error);
    }
  },

  resetState: () => {
    set({
      dbState: {
        state: "disconnected",
        path: null,
        error: null,
      },
    });
  },

  checkAndConnectIfNeeded: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    const { appStatus } = useAppStore.getState();
    const { getStatus, connect } = get();

    if (!isAuthenticated() || appStatus !== "ready") return;

    try {
      // Get current database status
      await getStatus();
      const currentState = get().dbState;

      // If user is authenticated but db isn't connected, try to connect
      if (
        currentState.state !== "connected" &&
        currentState.state !== "connecting"
      ) {
        await connect();
      }
    } catch (err) {
      console.error("Failed to check and connect to database:", err);
    }
  },
}));

// Set up event listeners for database state changes
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    if (window.EnjoyAPI) {
      // Set up event listener for database state changes
      window.EnjoyAPI.events.on("db-state-changed", (state: DbState) => {
        useDbStore.setState({ dbState: state });
      });

      // Get initial status
      useDbStore.getState().getStatus();

      // Listen for app status changes
      useAppStore.subscribe((state, prevState) => {
        if (
          state.appStatus === "ready" &&
          (state.appStatus !== prevState.appStatus ||
            state.initStatus.currentStep !== prevState.initStatus.currentStep)
        ) {
          useDbStore.getState().checkAndConnectIfNeeded();
        }
      });

      // Listen for auth state changes
      useAuthStore.subscribe((state, prevState) => {
        if (state.currentUser?.id !== prevState.currentUser?.id) {
          useDbStore.getState().checkAndConnectIfNeeded();
        }
      });
    }
  });
}
