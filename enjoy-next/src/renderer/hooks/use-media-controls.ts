import {
  useMeidaPlayBackStore,
  usePlayerSettingStore,
  useTranscriptionStore,
} from "@renderer/store";
import { debounce } from "lodash";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

type MediaElement = HTMLVideoElement | HTMLAudioElement;
type MediaEventHandler = (e: Event) => void;
type EventHandlers = Record<string, MediaEventHandler>;

const TIME_THRESHOLD = 0.01;
const CHECKING_INTERVAL = 500;

export const useMediaControls = (
  src: string
): {
  ref: React.RefObject<MediaElement | null>;
  togglePlay: () => Promise<void> | void;
  toggleLooping: () => void;
  destroy: () => void;
  playNextSentence: () => void;
  playPreviousSentence: () => void;
} => {
  const loadingTime = useRef(0);
  const ref = useRef<MediaElement | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    setSrc,
    setMediaElement,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    activeRange,
    setActiveRange,
    loading,
    setLoading,
    setSeeking,
    setError,
    reset,
  } = useMeidaPlayBackStore();
  const { playMode, looping, setLooping } = usePlayerSettingStore();

  const { nextSentence, previousSentence } = useTranscriptionStore();

  const checkMediaStatus = () => {
    if (!ref.current) return false;

    const media = ref.current;

    try {
      const hasMetadata = media.readyState >= HTMLMediaElement.HAVE_METADATA;
      const hasDuration = isFinite(media.duration) && media.duration > 0;
      const hasSeekableRanges =
        media.seekable &&
        media.seekable.length > 0 &&
        media.seekable.end(0) !== 0;

      const isReady = hasMetadata && hasDuration && hasSeekableRanges;

      logMediaStatus(media, isReady);

      if (isReady) {
        if (loading) {
          setLoading(false);
        }
      } else if (
        media.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA &&
        !isReady
      ) {
        console.debug(
          "Media loaded, but not ready for playback, trying to reload",
          media.src
        );
        if (!loading) {
          setLoading(true);
          ref.current.load();
        }
      } else if (loadingTime.current > CHECKING_INTERVAL * 10) {
        toast.error("Media is taking too long to load, please wait");
        throw new Error("Media is taking too long to load, please wait");
      } else if (loadingTime.current > CHECKING_INTERVAL * 5) {
        console.warn(
          `Media is taking too long to load: ${loadingTime.current}ms`
        );
      } else {
        loadingTime.current += CHECKING_INTERVAL;
        console.debug(
          `Still loading, used ${loadingTime.current}ms to check media status`
        );
      }

      return isReady;
    } catch (error) {
      handleError("Error checking media status", error);
      throw error;
    }
  };

  const debouncedCheckMediaStatus = useCallback(
    debounce(checkMediaStatus, CHECKING_INTERVAL),
    []
  );

  const logMediaStatus = (media: MediaElement, isReady: boolean) => {
    const hasSeekableRanges =
      media.seekable &&
      media.seekable.length > 0 &&
      media.seekable.end(0) !== 0;
    const hasBufferedData = media.buffered && media.buffered.length > 0;
    const networkStateText = ["EMPTY", "IDLE", "LOADING", "NO_SOURCE"][
      media.networkState
    ];

    console.debug("Media status check:", {
      src: media.src,
      readyState: media.readyState,
      networkState: networkStateText,
      duration: media.duration,
      hasSeekableRanges,
      seekableStart: hasSeekableRanges ? media.seekable.start(0) : null,
      seekableEnd: hasSeekableRanges ? media.seekable.end(0) : null,
      hasEnoughData: media.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA,
      hasBufferedData,
      bufferedRanges: hasBufferedData
        ? Array.from({ length: media.buffered.length }).map((_, i) => [
            media.buffered.start(i),
            media.buffered.end(i),
          ])
        : [],
      isReady,
    });
  };

  const handleError = (message: string, error: unknown) => {
    console.error(message, error);
    setError(
      new Error(
        `${message}: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  };

  const togglePlay = (): Promise<void> | void => {
    if (!ref.current) return Promise.resolve();
    return ref.current.paused ? ref.current.play() : ref.current.pause();
  };

  const seek = (time: number) => {
    if (!ref.current) return false;
    const element = ref.current;

    if (element.seeking) {
      console.debug("Media is seeking, skipping seek");
      return false;
    }

    if (element.currentTime === time) {
      console.debug(
        "CurrentTime is already at the desired time, skipping seek"
      );
      return true;
    }

    return performSeek(element, time);
  };

  const performSeek = (element: MediaElement, time: number) => {
    const seekable = element.seekable;
    if (seekable.length === 0) {
      if (element.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
        console.debug("Media seekable is empty, reloading");
        ref.current?.load();
      }
      return false;
    }

    const seekableStart = seekable.start(0);
    const seekableEnd = seekable.end(0);
    if (time < seekableStart || time > seekableEnd) {
      console.debug(
        "time is out of seekable range",
        time,
        seekableStart,
        seekableEnd,
        element.readyState
      );
      toast.error(
        "Time is out of seekable range, maybe the media is not loaded yet"
      );
      ref.current?.load();
      return false;
    }

    setSeeking(true);
    const safeTime = Math.ceil(Math.max(0, time) * 1000) / 1000.0;
    element.currentTime = safeTime;
    return true;
  };

  const destroy = () => {
    if (!ref.current) return;

    try {
      if (!ref.current.paused) {
        ref.current.pause();
      }

      Object.entries(handlers).forEach(([event, handler]) => {
        ref.current?.removeEventListener(event, handler);
      });

      ref.current.removeEventListener("timeupdate", handleRangeConstraint);

      ref.current.removeAttribute("src");
      ref.current.load();

      reset();

      loadingTime.current = 0;

      ref.current = null;

      console.debug(
        "Media element successfully destroyed and resources released"
      );
    } catch (error) {
      console.error("Error destroying media element", error);
    }
  };

  const playNextSentence = () => {
    const sentence = nextSentence();
    if (!sentence) return;
    setActiveRange({
      start: sentence.startTime,
      end: sentence.endTime,
      autoPlay: true,
    });
  };

  const playPreviousSentence = () => {
    const sentence = previousSentence();
    if (!sentence) return;
    setActiveRange({
      start: sentence.startTime,
      end: sentence.endTime,
      autoPlay: true,
    });
  };

  const toggleLooping = () => {
    setLooping(!looping);
  };

  const handleRangeConstraint = (e: Event) => {
    const element = e.target as MediaElement;
    if (
      element.currentTime >= activeRange.end ||
      element.currentTime < activeRange.start - TIME_THRESHOLD
    ) {
      console.debug(
        "currentTime is out of range, seeking to start",
        element.currentTime,
        activeRange.start,
        activeRange.end
      );

      const seeked = seek(activeRange.start);

      if (seeked) {
        console.debug("Successfully sought to start");
        if (looping) {
          console.debug("Looping is", looping);
          element.play();
        } else {
          console.debug("Looping is", looping);
          element.pause();
        }
      } else {
        console.debug(
          "Failed to seek to start, resetting active range to 0 and duration"
        );
      }
    }
  };

  const handlers: EventHandlers = {
    canplaythrough: () => {
      if (loading) {
        setLoading(false);
      }
    },
    timeupdate: (event: Event) => {
      const element = event.target as MediaElement;
      setCurrentTime(element.currentTime);
    },
    durationchange: (event: Event) => {
      const element = event.target as MediaElement;
      console.debug("durationchange", element.duration);
      if (!isFinite(element.duration)) {
        checkMediaStatus();
        return;
      }
      setDuration(element.duration);
      setActiveRange({ start: 0, end: element.duration });
    },
    seeking: () => {
      setSeeking(true);
    },
    seeked: () => {
      setSeeking(false);
      console.debug("seeked", ref.current?.currentTime);
    },
    stalled: () => {
      if (!loading) {
        setLoading(true);
      }
      toast.error("Stalled");
      setError(
        new Error("Media data is unexpectedly not forthcoming when fetching")
      );
    },
    ended: () => {
      setIsPlaying(false);
      seek(activeRange.start);
    },
    pause: () => setIsPlaying(false),
    play: () => setIsPlaying(true),
    error: (event: Event) => {
      const element = event.target as MediaElement;
      console.error("Media element error:", element.error);
      setError(
        new Error(
          `Media element error: ${element.error?.message} ${element.error?.code}`
        )
      );
      setIsPlaying(false);
      setLoading(false);
    },
    waiting: () => {},
    playing: () => {},
  };

  const setupMedia = () => {
    const mediaElement = ref.current!;

    setSrc(src);
    setMediaElement(mediaElement);
    setLoading(true);
    mediaElement.src = src;
    mediaElement.load();
  };

  const setupMediaStatusCheck = () => {
    if (!src) return;

    setLoading(true);
    try {
      debouncedCheckMediaStatus();
    } catch (error) {
      console.error("Error checking media status:", error);
    }

    checkIntervalRef.current = setInterval(() => {
      try {
        if (checkMediaStatus()) {
          console.debug("Media ready check passed, clearing interval");
          clearInterval(checkIntervalRef.current!);
          setLoading(false);
        } else {
          console.debug("Media ready check failed, continuing");
          setLoading(true);
        }
      } catch (error) {
        console.error("Error checking media status:", error);
        clearInterval(checkIntervalRef.current!);
      }
    }, CHECKING_INTERVAL);
  };

  useEffect(() => {
    if (!ref.current) return;

    setupMedia();
    setupMediaStatusCheck();

    Object.entries(handlers).forEach(([event, handler]) => {
      ref.current!.addEventListener(event, handler);
    });

    return () => {
      clearInterval(checkIntervalRef.current!);
      if (!ref.current) return;
      Object.entries(handlers).forEach(([event, handler]) => {
        console.debug("removing event listener", event);
        ref.current!.removeEventListener(event, handler);
      });
    };
  }, [src]);

  useEffect(() => {
    if (!ref.current) return;

    console.debug("activeRange changed", activeRange);
    if (typeof activeRange.start === "number") {
      seek(activeRange.start);
    }
    ref.current.addEventListener("timeupdate", handleRangeConstraint);
    return () => {
      if (!ref.current) return;

      ref.current.removeEventListener("timeupdate", handleRangeConstraint);
    };
  }, [activeRange, src, looping]);

  useEffect(() => {
    if (!ref.current) return;

    if (playMode === "readMode") {
      setActiveRange({
        start: 0,
        end: ref.current.duration,
        autoPlay: false,
      });
    }
  }, [playMode]);

  return {
    ref,
    togglePlay,
    destroy,
    toggleLooping,
    playNextSentence,
    playPreviousSentence,
  };
};
