import { create } from "zustand";

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

  nonce: string | null;
  logingMethod: LoginMethodType;

  // Actions
  setLogingMethod: (logingMethod: LoginMethodType) => void;
  autoLogin: () => Promise<void>;
  generateNonce: () => string;
  login: (currentUser: UserType) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: () => !!get().currentUser?.id,
  currentUser: null,

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
      window.EnjoyAPI.appConfig.set("user", null);
      window.EnjoyAPI.appConfig.rememberUser(currentUser);
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
}));

export default useAuthStore;
