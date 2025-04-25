import { useEffect, useRef, useState } from "react";
import { useSpeechPlaybackStore } from "../store/use-speech-playback-store";

export function useSpeechControls() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<MediaError | null>(null);
  const ref = useRef<HTMLAudioElement | null>(null);

  const handlers = {
    timeupdate: () => {
      setCurrentTime(ref.current?.currentTime ?? 0);
    },
    durationchange: () => {
      setDuration(ref.current?.duration ?? 0);
    },
    play: () => {
      setIsPlaying(true);
    },
    pause: () => {
      setIsPlaying(false);
    },
    error: () => {
      setError(ref.current?.error ?? null);
    },
  };

  const togglePlay = async () => {
    if (!ref.current) return;

    if (ref.current.paused) {
      try {
        await ref.current.play();
      } catch (error) {
        setError(error as MediaError);
      }
    } else {
      ref.current.pause();
    }
  };

  const pause = () => {
    if (!ref.current) return;
    ref.current.pause();
  };

  useEffect(() => {
    if (!ref.current) return;

    Object.keys(handlers).forEach((event) => {
      ref.current!.addEventListener(
        event,
        handlers[event as keyof typeof handlers]
      );
    });

    return () => {
      if (!ref.current) return;

      Object.keys(handlers).forEach((event) => {
        ref.current!.removeEventListener(
          event,
          handlers[event as keyof typeof handlers]
        );
      });
    };
  }, [ref.current]);

  return {
    ref,
    togglePlay,
    pause,
    currentTime,
    duration,
    isPlaying,
    error,
  };
}
