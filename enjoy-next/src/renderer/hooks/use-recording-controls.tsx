import { useEffect, useMemo } from "react";
import { useRecordingPlaybackStore } from "../store/use-recording-playback-store";
import { useMediaFrequencies } from "./use-ffmpeg";

type MediaEventHandler = (e: Event) => void;
type EventHandlers = Record<string, MediaEventHandler>;

export function useRecordingControls(props: {
  recording: RecordingEntity;
  ref: React.RefObject<HTMLAudioElement | null>;
}) {
  const { recording, ref } = props;
  const { setIsPlaying, setRecording, setCurrentTime, setFrequencies, reset } =
    useRecordingPlaybackStore();

  const { refetch: refetchFrequencies } = useMediaFrequencies(recording.src, {
    enabled: false,
  });

  const togglePlay = () => {
    if (!ref.current) return;

    const mediaElement = ref.current!;
    if (mediaElement.paused) {
      mediaElement.play();
    } else {
      mediaElement.pause();
    }
  };
  const setupMedia = () => {
    if (!ref.current) return;
    if (!recording) return;

    setRecording(recording);
    const mediaElement = ref.current!;
    if (mediaElement.src !== recording.src) {
      mediaElement.src = recording.src;
    }

    Object.entries(handlers).forEach(([event, handler]) => {
      mediaElement.addEventListener(event, handler);
    });

    refetchFrequencies().then(({ data }) => {
      const { frequencies = [] } = data ?? {};
      setFrequencies(frequencies);
    });
  };

  const teardownMedia = () => {
    if (!ref.current) return;

    const mediaElement = ref.current!;
    mediaElement.src = "";
    mediaElement.pause();

    Object.entries(handlers).forEach(([event, handler]) => {
      mediaElement.removeEventListener(event, handler);
    });
    reset();
  };

  const handlers: EventHandlers = {
    timeupdate: (event: Event) => {
      const element = event.target as HTMLAudioElement;
      setCurrentTime(element.currentTime);
    },
    pause: () => {
      setIsPlaying(false);
    },
    play: () => {
      setIsPlaying(true);
    },
    ended: () => {
      setIsPlaying(false);
    },
  };

  useEffect(() => {
    if (!ref.current) return;
    setupMedia();

    return () => {
      teardownMedia();
    };
  }, [ref, recording]);

  return {
    togglePlay,
  };
}
