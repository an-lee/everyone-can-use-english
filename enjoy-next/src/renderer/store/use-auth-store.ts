import { create } from "zustand";
import { UserType } from "@renderer/api";

export type LoginMethodType =
  | "google_oauth2"
  | "github"
  | "mixin"
  | "email"
  | "phone"
  | null;

type AuthState = {
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
      window.EnjoyAPI.appConfig.set("user.id", currentUser.id);
      window.EnjoyAPI.appConfig.set("user.name", currentUser.name);
      window.EnjoyAPI.appConfig.set("user.avatarUrl", currentUser.avatarUrl);
    }
  },

  logout: () => {
    const currentUser = get().currentUser;
    if (!currentUser) return;

    if (window.EnjoyAPI) {
      // First check if there's an active database connection
      window.EnjoyAPI.db
        .status()
        .then((status) => {
          if (status.state === "connected") {
            console.log("Disconnecting database before logout");
            window.EnjoyAPI.db
              .disconnect()
              .catch((err) =>
                console.error("Error disconnecting DB before logout:", err)
              );
          }
        })
        .catch((err) => console.error("Error checking DB status:", err));

      // Proceed with logout
      console.log("Logging out user:", currentUser.id);
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
