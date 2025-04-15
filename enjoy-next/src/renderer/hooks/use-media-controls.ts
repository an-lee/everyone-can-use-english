import { useMediaPlayer } from "@renderer/store/use-media-player";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

type MediaEventHandler = (e: Event) => void;
type EventHandlers = Record<string, MediaEventHandler>;

const TIME_THRESHOLD = 0.01;
const CHECKING_INTERVAL = 500;
const RETRY_INTERVAL = 5000;

export const useMediaControls = (
  src: string
): {
  ref: React.RefObject<HTMLVideoElement | HTMLAudioElement | null>;
  togglePlay: () => Promise<void> | void;
  destroy: () => void;
} => {
  const loadingTime = useRef(0);

  const {
    setMediaElement,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    activeRange,
    setActiveRange,
    setLoading,
    setSeeking,
    setError,
    setInteractable,
    reset,
  } = useMediaPlayer();

  const ref = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  const checkReadyState = () => {
    if (!ref.current) return;

    if (ref.current.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  };

  // Check if media is ready for interaction
  const checkInteractability = () => {
    if (!ref.current) return;

    const media = ref.current;

    try {
      // Basic requirements for interactability
      const hasMetadata = media.readyState >= HTMLMediaElement.HAVE_METADATA;
      const hasDuration = isFinite(media.duration) && media.duration > 0;
      const hasSeekableRanges =
        media.seekable &&
        media.seekable.length > 0 &&
        media.seekable.end(0) !== 0;

      // Optional but helpful checks
      const hasBufferedData = media.buffered && media.buffered.length > 0;
      const hasEnoughData =
        media.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA;

      // Additional check for network state
      const networkState = media.networkState;
      const networkStateText = ["EMPTY", "IDLE", "LOADING", "NO_SOURCE"][
        networkState
      ];

      // Combined check
      const canInteract = hasMetadata && hasDuration && hasSeekableRanges;

      // Log detailed status for debugging
      console.debug("Media interactability check:", {
        src: media.src,
        readyState: media.readyState,
        networkState: networkStateText,
        duration: media.duration,
        hasSeekableRanges,
        seekableStart: hasSeekableRanges ? media.seekable.start(0) : null,
        seekableEnd: hasSeekableRanges ? media.seekable.end(0) : null,
        hasEnoughData,
        hasBufferedData,
        bufferedRanges: hasBufferedData
          ? Array.from({ length: media.buffered.length }).map((_, i) => [
              media.buffered.start(i),
              media.buffered.end(i),
            ])
          : [],
        canInteract,
      });

      setInteractable(canInteract);

      if (
        media.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA &&
        !canInteract
      ) {
        console.debug(
          "Media loaded, but not interactable, trying to reload",
          media.src
        );
        ref.current.load();
      } else if (loadingTime.current > RETRY_INTERVAL) {
        console.debug(
          "loadingTime is greater than RETRY_INTERVAL, reloading",
          loadingTime.current
        );
        loadingTime.current = 0;
        ref.current.load();
      } else {
        console.debug(
          "Still loading, adding to loadingTime",
          loadingTime.current
        );
        loadingTime.current += CHECKING_INTERVAL;
      }

      return canInteract;
    } catch (error) {
      console.error("Error checking media interactability:", error);
      setError(
        new Error(
          `Error checking media interactability: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      );
      return false;
    }
  };

  const togglePlay = (): Promise<void> | void => {
    if (!ref.current) return Promise.resolve();
    if (ref.current.paused) {
      return ref.current.play();
    } else {
      return ref.current.pause();
    }
  };

  const seek = (time: number) => {
    if (!ref.current) return;

    const element = ref.current;
    if (element.seeking) {
      console.debug("seeking is true");
      return false;
    }

    if (element.currentTime === time) {
      console.debug("currentTime is already at the desired time");
      return true;
    }

    const seekable = element.seekable;
    if (seekable.length === 0) {
      console.debug("seekable is empty");
      ref.current.load();
      toast.error("Media is not loaded yet");
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
      ref.current.load();
      return false;
    }

    const safeTime = Math.ceil(Math.max(0, time) * 1000) / 1000.0;
    element.currentTime = safeTime;

    return true;
  };

  const destroy = () => {
    if (!ref.current) return;

    try {
      // Stop any ongoing playback
      if (!ref.current.paused) {
        ref.current.pause();
      }

      // Remove all event listeners
      Object.entries(handlers).forEach(([event, handler]) => {
        ref.current?.removeEventListener(event, handler);
      });

      // Remove the range constraint listener
      ref.current.removeEventListener("timeupdate", handleRangeConstraint);

      // Clear the source to stop buffering and release network resources
      ref.current.removeAttribute("src");
      ref.current.load(); // Forces the browser to reset the media element

      // Reset state in the media player store
      reset();

      // Clear any cached data
      loadingTime.current = 0;

      // Set the ref to null
      ref.current = null;

      console.debug(
        "Media element successfully destroyed and resources released"
      );
    } catch (error) {
      console.error("Error destroying media element", error);
    }
  };

  // Define all event handlers
  const handlers: EventHandlers = {
    canplaythrough: () => {
      checkReadyState();
    },
    timeupdate: (event: Event) => {
      const element = event.target as HTMLVideoElement | HTMLAudioElement;
      setCurrentTime(element.currentTime);
    },
    durationchange: (event: Event) => {
      const element = event.target as HTMLVideoElement | HTMLAudioElement;
      console.debug("durationchange", element.duration);
      if (!isFinite(element.duration)) {
        checkReadyState();
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
    },
    stalled: () => {
      toast.error("Stalled");
      setError(
        new Error("Media data is unexpectedly not forthcoming when fetching")
      );
    },
    ended: () => {
      setIsPlaying(false);
      seek(activeRange.start);
    },
    pause: () => {
      setIsPlaying(false);
    },
    play: () => {
      setIsPlaying(true);
    },
    error: (event: Event) => {
      const element = event.target as HTMLVideoElement | HTMLAudioElement;
      console.debug("Media element error:", element.error);
      setError(
        new Error(
          `Media element error: ${element.error?.message} ${element.error?.code}`
        )
      );
      setIsPlaying(false);
    },
  };

  const handleRangeConstraint = (e: Event) => {
    console.debug("handleRangeConstraint", activeRange);
    const element = e.target as HTMLVideoElement | HTMLAudioElement;
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

      if (!seek(activeRange.start)) {
        console.debug(
          "Failed to seek to start, resetting active range to 0 and duration"
        );
        setActiveRange({ start: 0, end: element.duration });
      } else {
        console.debug("Successfully sought to start");
      }
    }
  };

  // Main effect for media element setup
  useEffect(() => {
    console.log("useMediaElement", src);
    if (!ref.current) return;

    // Register the element with the store
    setMediaElement(ref.current);
    ref.current.src = src;
    ref.current.load();
    setLoading(true);

    // Add all event listeners
    Object.entries(handlers).forEach(([event, handler]) => {
      ref.current!.addEventListener(event, handler);
    });

    // Run an initial check
    setInteractable(false);
    checkInteractability();

    // Set up a periodic check for the first few seconds
    // This helps in cases where events aren't reliably fired
    const checkInterval = setInterval(() => {
      if (checkInteractability()) {
        clearInterval(checkInterval);
      }
    }, CHECKING_INTERVAL);

    return () => {
      // Clean up interval
      clearInterval(checkInterval);

      if (!ref.current) return;
      Object.entries(handlers).forEach(([event, handler]) => {
        console.debug("removing event listener", event);
        ref.current!.removeEventListener(event, handler);
      });
    };
  }, [src]);

  useEffect(() => {
    console.debug("useEffect activeRange", activeRange);
    if (!ref.current) return;

    seek(activeRange.start);
    ref.current.addEventListener("timeupdate", handleRangeConstraint);

    return () => {
      ref.current?.removeEventListener("timeupdate", handleRangeConstraint);
    };
  }, [activeRange, src]);

  return { ref, togglePlay, destroy };
};
