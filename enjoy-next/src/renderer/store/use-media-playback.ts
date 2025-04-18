import { create } from "zustand";

type MediaPlayBackState = {
  mediaElement: HTMLVideoElement | HTMLAudioElement | null;
  setMediaElement: (mediaElement: HTMLVideoElement | HTMLAudioElement) => void;
  clearMediaElement: () => void;

  loading: boolean;
  setLoading: (loading: boolean) => void;

  seeking: boolean;
  setSeeking: (seeking: boolean) => void;

  interactable: boolean;
  setInteractable: (interactable: boolean) => void;

  currentTime: number;
  setCurrentTime: (currentTime: number) => void;

  duration: number;
  setDuration: (duration: number) => void;

  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;

  activeRange: { start: number; end: number; autoPlay?: boolean };
  setActiveRange: (activeRange: {
    start: number;
    end: number;
    autoPlay?: boolean;
  }) => void;

  error: Error | null;
  setError: (error: Error | null) => void;

  directSeek: (time: number) => void;

  reset: () => void;
};

export const useMediaPlayBack = create<MediaPlayBackState>((set, get) => ({
  mediaElement: null,

  setMediaElement: (mediaElement: HTMLVideoElement | HTMLAudioElement) => {
    set({ mediaElement });
    if (window) {
      (window as any).MEDIA_ELEMENT = mediaElement;
    }
  },
  clearMediaElement: () => {
    set({ mediaElement: null });
    if (window) {
      (window as any).MEDIA_ELEMENT = null;
    }
  },

  loading: false,
  setLoading: (loading: boolean) => set({ loading }),

  seeking: false,
  setSeeking: (seeking: boolean) => set({ seeking }),

  interactable: false,
  setInteractable: (interactable: boolean) => set({ interactable }),

  currentTime: 0,
  setCurrentTime: (currentTime: number) => set({ currentTime }),

  duration: 0,
  setDuration: (duration: number) => set({ duration }),

  isPlaying: false,
  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

  activeRange: { start: 0, end: 0, autoPlay: false },
  setActiveRange: (activeRange: {
    start: number;
    end: number;
    autoPlay?: boolean;
  }) => {
    set({ activeRange });
  },

  error: null,
  setError: (error: Error | null) => set({ error }),

  directSeek: (time: number) => {
    if (get().mediaElement) {
      get().mediaElement!.currentTime = time;
    }
  },

  reset: () => {
    set({
      mediaElement: null,
      loading: false,
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      activeRange: { start: 0, end: 0, autoPlay: false },
      error: null,
    });
  },
}));
