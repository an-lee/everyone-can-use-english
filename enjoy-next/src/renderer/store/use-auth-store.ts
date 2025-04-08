import { create } from "zustand";
import { useDbStore } from "./use-db-store";

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: () => !!get().currentUser?.id,
  currentUser: null,
  sessions: [],
  logingMethod: null,
  nonce: null,

  // State setters
  setLogingMethod: (logingMethod: LoginMethodType) => {
    if (logingMethod) {
      get().generateNonce();
    }
    set({ logingMethod });
  },

  login: (currentUser: UserType) => {
    set({ currentUser, nonce: null, logingMethod: null });
    // Sync to main process
    if (window.EnjoyAPI) {
      // Set the user object in appConfig
      // The backend config handler will handle setting needed fields
      window.EnjoyAPI.appConfig.set("user", currentUser);

      // Only explicitly connect to database if needed
      // This prevents duplicate connections, as the main process already
      // handles connection when user changes
      const { getStatus } = useDbStore.getState();
      getStatus()
        .then(() => {
          const {
            dbState,
            shouldManuallyConnect,
            getConnectionStatusReason,
            connect,
          } = useDbStore.getState();

          console.log(
            `[Auth] DB state after login: ${dbState.state}, autoConnected: ${dbState.autoConnected}`
          );

          // Use the helper method to check if we need to connect
          if (shouldManuallyConnect(dbState)) {
            console.log("Connecting to database after login (manual connect)");
            connect().catch((err: Error) => {
              console.error("Error connecting to database after login:", err);
            });
          } else {
            console.log(
              `Not connecting to database: ${getConnectionStatusReason(dbState)}`
            );
          }
        })
        .catch((err: Error) => {
          console.error("Error checking db status:", err);
        });
    }
  },

  logout: () => {
    const currentUser = get().currentUser;
    if (!currentUser) return;

    if (window.EnjoyAPI) {
      console.log("Logging out user:", currentUser.id);
      // We don't need to check DB status manually - the main process handles this
      window.EnjoyAPI.appConfig.logout();
    }

    set({ currentUser: null });
  },

  // Actions
  autoLogin: async () => {
    if (window.EnjoyAPI) {
      const user = await window.EnjoyAPI.appConfig.currentUser();
      set({ currentUser: user });
    }
  },

  generateNonce: () => {
    const nonce = `ENJOYAPP${Math.random().toString(36).substring(2, 15)}`;
    set({ nonce });
    return nonce;
  },

  fetchSessions: async () => {
    if (window.EnjoyAPI) {
      const sessions = await window.EnjoyAPI.appConfig.get("sessions");
      set({ sessions });
    }
  },
}));

export default useAuthStore;
