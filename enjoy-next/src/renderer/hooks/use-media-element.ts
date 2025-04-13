import { useMediaPlayer } from "@renderer/store/use-media-player";
import { useEffect, useRef, useCallback } from "react";

export const useMediaElement = () => {
  const {
    setMediaElement,
    clearMediaElement,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    activeRange,
    setActiveRange,
  } = useMediaPlayer();
  const ref = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  // Store event handlers as refs to maintain their identity between renders
  const handlersRef = useRef({
    timeUpdate: null as null | ((e: Event) => void),
    loadedMetadata: null as null | ((e: Event) => void),
    ended: null as null | ((e: Event) => void),
    pause: null as null | ((e: Event) => void),
    play: null as null | ((e: Event) => void),
    rangeTimeUpdate: null as null | ((e: Event) => void),
  });

  // Setup and cleanup functions
  const setupDefaultListeners = useCallback(
    (element: HTMLVideoElement | HTMLAudioElement) => {
      // Create persistent handlers
      handlersRef.current.timeUpdate = () => {
        setCurrentTime(element.currentTime);
      };

      handlersRef.current.loadedMetadata = () => {
        setDuration(element.duration);
        setActiveRange({ start: 0, end: element.duration });
      };

      handlersRef.current.ended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      handlersRef.current.pause = () => {
        setIsPlaying(false);
      };

      handlersRef.current.play = () => {
        setIsPlaying(true);
      };

      // Add event listeners
      element.addEventListener("timeupdate", handlersRef.current.timeUpdate);
      element.addEventListener(
        "loadedmetadata",
        handlersRef.current.loadedMetadata
      );
      element.addEventListener("ended", handlersRef.current.ended);
      element.addEventListener("pause", handlersRef.current.pause);
      element.addEventListener("play", handlersRef.current.play);
    },
    [setCurrentTime, setDuration, setActiveRange, setIsPlaying]
  );

  const cleanupDefaultListeners = useCallback(
    (element: HTMLVideoElement | HTMLAudioElement) => {
      if (handlersRef.current.timeUpdate) {
        element.removeEventListener(
          "timeupdate",
          handlersRef.current.timeUpdate
        );
      }
      if (handlersRef.current.loadedMetadata) {
        element.removeEventListener(
          "loadedmetadata",
          handlersRef.current.loadedMetadata
        );
      }
      if (handlersRef.current.ended) {
        element.removeEventListener("ended", handlersRef.current.ended);
      }
      if (handlersRef.current.pause) {
        element.removeEventListener("pause", handlersRef.current.pause);
      }
      if (handlersRef.current.play) {
        element.removeEventListener("play", handlersRef.current.play);
      }
    },
    []
  );

  const setupRangeListeners = useCallback(
    (element: HTMLVideoElement | HTMLAudioElement) => {
      // Remove previous range timeupdate listener if it exists
      if (handlersRef.current.rangeTimeUpdate) {
        element.removeEventListener(
          "timeupdate",
          handlersRef.current.rangeTimeUpdate
        );
      }

      // Create a new handler
      handlersRef.current.rangeTimeUpdate = () => {
        if (
          element.currentTime < activeRange.start ||
          element.currentTime > activeRange.end
        ) {
          element.pause();
          element.currentTime = activeRange.start;
        }
      };

      // Add the new listener
      element.addEventListener(
        "timeupdate",
        handlersRef.current.rangeTimeUpdate
      );
    },
    [activeRange]
  );

  const cleanupRangeListeners = useCallback(
    (element: HTMLVideoElement | HTMLAudioElement) => {
      if (handlersRef.current.rangeTimeUpdate) {
        element.removeEventListener(
          "timeupdate",
          handlersRef.current.rangeTimeUpdate
        );
      }
    },
    []
  );

  // Setup media element when ref is available
  useEffect(() => {
    const element = ref.current;
    if (element) {
      setMediaElement(element);
      setupDefaultListeners(element);
    }

    return () => {
      if (element) {
        cleanupDefaultListeners(element);
      }
      clearMediaElement();
    };
  }, [setupDefaultListeners, cleanupDefaultListeners]);

  // Update range listeners when activeRange changes
  useEffect(() => {
    const element = ref.current;
    if (element) {
      setupRangeListeners(element);
    }

    return () => {
      if (element) {
        cleanupRangeListeners(element);
      }
    };
  }, [setupRangeListeners, cleanupRangeListeners]);

  return ref;
};
