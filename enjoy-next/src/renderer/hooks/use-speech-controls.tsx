import { useEffect, useRef, useState } from "react";
import { useSpeechPlaybackStore } from "../store/use-speech-playback-store";

export function useSpeechControls() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
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
  };

  const togglePlay = () => {
    if (!ref.current) return;

    if (ref.current.paused) {
      ref.current.play();
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
  };
}
