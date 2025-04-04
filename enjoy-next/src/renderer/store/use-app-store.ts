import { create } from "zustand";
import { persist } from "zustand/middleware";

type AppState = {
  isLoading: boolean;
  currentView: string;
  currentUser: UserType | null;
  setLoading: (loading: boolean) => void;
  setCurrentView: (view: string) => void;
  isAuthenticated: () => boolean;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isLoading: false,
      currentView: "home",
      currentUser: null,
      setCurrentUser: (user: UserType | null) => set({ currentUser: user }),
      setLoading: (loading) => set({ isLoading: loading }),
      setCurrentView: (view) => set({ currentView: view }),
      isAuthenticated: () => get().currentUser !== null,
    }),
    {
      name: "app-storage",
    }
  )
);
