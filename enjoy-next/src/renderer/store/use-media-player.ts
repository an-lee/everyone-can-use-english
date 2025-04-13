import { create } from "zustand";

type MediaPlayerState = {
  mediaElement: HTMLVideoElement | HTMLAudioElement | null;
  setMediaElement: (mediaElement: HTMLVideoElement | HTMLAudioElement) => void;
  clearMediaElement: () => void;

  currentTime: number;
  setCurrentTime: (currentTime: number) => void;

  duration: number;
  setDuration: (duration: number) => void;

  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlay: () => void;

  activeRange: { start: number; end: number };
  setActiveRange: (activeRange: { start: number; end: number }) => void;

  seek: (time: number) => void;
};

export const useMediaPlayer = create<MediaPlayerState>((set, get) => ({
  mediaElement: null,

  setMediaElement: (mediaElement: HTMLVideoElement | HTMLAudioElement) =>
    set({ mediaElement }),
  clearMediaElement: () => set({ mediaElement: null }),

  currentTime: 0,
  setCurrentTime: (currentTime: number) => set({ currentTime }),

  duration: 0,
  setDuration: (duration: number) => set({ duration }),

  isPlaying: false,
  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

  activeRange: { start: 0, end: 0 },
  setActiveRange: (activeRange: { start: number; end: number }) =>
    set({ activeRange }),

  togglePlay: () => {
    const mediaElement = get().mediaElement;
    const isPlaying = get().isPlaying;

    if (mediaElement) {
      if (isPlaying) {
        mediaElement.pause();
      } else {
        mediaElement.play();
      }
    }
  },
  seek: (time: number) => {
    const mediaElement = get().mediaElement;
    if (mediaElement) {
      mediaElement.currentTime = time;
    }
  },
}));
