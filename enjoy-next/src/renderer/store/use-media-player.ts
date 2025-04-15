import { create } from "zustand";

type MediaPlayerState = {
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

  looping: boolean;
  setLooping: (looping: boolean) => void;

  error: Error | null;
  setError: (error: Error | null) => void;

  reset: () => void;
};

export const useMediaPlayer = create<MediaPlayerState>((set, get) => ({
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
    console.debug("Setting active range", activeRange);
    set({ activeRange });
  },

  looping: false,
  setLooping: (looping: boolean) => set({ looping }),

  error: null,
  setError: (error: Error | null) => set({ error }),

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
