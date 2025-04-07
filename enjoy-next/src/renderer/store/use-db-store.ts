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
    const { appState } = useAppStore.getState();
    const { getStatus, connect } = get();

    if (!isAuthenticated() || appState.status !== "ready") return;

    try {
      // Add a small delay to allow main process to update state
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get current database status
      await getStatus();
      const currentState = get().dbState;

      console.log(
        `[DB Store] Checking connection: state=${currentState.state}, autoConnected=${currentState.autoConnected}`
      );

      // Only connect if not already connected, not connecting, and not auto-connecting
      if (
        currentState.state !== "connected" &&
        currentState.state !== "connecting" &&
        currentState.autoConnected !== true
      ) {
        console.log(
          "Manually connecting to database from renderer (autoConnected=false)"
        );
        await connect();
      } else {
        console.log(
          `Not connecting to database: ${
            currentState.state === "connected"
              ? "already connected"
              : currentState.state === "connecting"
                ? "connection in progress"
                : "autoConnected is true"
          }`
        );
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
          state.appState.status === "ready" &&
          state.appState.status !== prevState.appState.status
        ) {
          useDbStore.getState().checkAndConnectIfNeeded();
        }
      });

      // Listen for auth state changes
      useAuthStore.subscribe((state, prevState) => {
        // Only attempt connection if user logged in AND we're not in an autoConnect mode
        // This prevents duplicate connections with the main process
        if (
          state.currentUser?.id !== prevState.currentUser?.id &&
          state.currentUser !== null
        ) {
          console.log(
            "Auth state changed in renderer, waiting before checking DB connection"
          );

          // Add a delay to allow main process to connect first
          setTimeout(() => {
            // Check database status first
            useDbStore
              .getState()
              .getStatus()
              .then(() => {
                const { dbState } = useDbStore.getState();

                console.log(
                  `[Auth Subscription] DB state check: ${dbState.state}, autoConnected: ${dbState.autoConnected}`
                );

                // Only continue if not already connected/connecting and not auto-connected
                if (
                  dbState.state !== "connected" &&
                  dbState.state !== "connecting" &&
                  dbState.autoConnected !== true
                ) {
                  console.log("Checking if manual DB connection needed");
                  useDbStore.getState().checkAndConnectIfNeeded();
                } else {
                  console.log(
                    `No manual connection needed: ${
                      dbState.state === "connected"
                        ? "already connected"
                        : dbState.state === "connecting"
                          ? "connection in progress"
                          : "autoConnected is true"
                    }`
                  );
                }
              });
          }, 500); // 500ms delay to let main process connect first
        }
      });
    }
  });
}
