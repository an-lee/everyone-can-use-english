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
      // Set the user object in appConfig
      // The backend config handler will handle setting needed fields
      window.EnjoyAPI.appConfig.set("user", currentUser);

      // Explicitly connect to database if needed
      window.EnjoyAPI.db
        .status()
        .then((status: any) => {
          if (status.state !== "connected") {
            console.log("Connecting to database after login");
            window.EnjoyAPI.db.connect().catch((err: Error) => {
              console.error("Error connecting to database after login:", err);
            });
          }
        })
        .catch((err: Error) => {
          console.error("Error checking db status:", err);
          // Try connecting anyway
          window.EnjoyAPI.db.connect().catch((err: Error) => {
            console.error("Error connecting to database after login:", err);
          });
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
