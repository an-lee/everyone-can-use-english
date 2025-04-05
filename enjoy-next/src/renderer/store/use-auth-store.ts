import { create } from "zustand";

type AuthState = {
  isAuthenticated: () => boolean;
  currentUser: UserType | null;
  setCurrentUser: (currentUser: UserType | null) => void;

  autoLogin: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: () => !!get().currentUser,
  currentUser: null,

  // State setters
  setCurrentUser: (currentUser: UserType | null) => {
    set({ currentUser });
    // Sync to main process
    if (window.EnjoyAPI) {
      window.EnjoyAPI.appConfig.set("user", currentUser);
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
}));

export default useAuthStore;
