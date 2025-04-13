import { create } from "zustand";

type MediaPlayerState = {
  src: string;
  error: string | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  setSrc: (src: string) => void;
  togglePlay: () => void;
  setCurrentTime: (currentTime: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
};

export const useMediaPlayer = create<MediaPlayerState>((set) => ({
  src: "",
  error: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  setSrc: (src: string) => set({ src }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setCurrentTime: (currentTime: number) => set({ currentTime }),
  setDuration: (duration: number) => set({ duration }),
  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
}));
