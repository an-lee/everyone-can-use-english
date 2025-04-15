import { useEffect } from "react";
import { useMediaPlayer } from "../store/use-media-player";
import { useMediaTranscription } from "../store/use-media-transcription";
import { useTranscriptionByTarget } from "./use-transcription";

export const useTranscriptionControls = (props: {
  targetId: string;
  targetType: string;
}) => {
  const { currentIndex, setCurrentIndex, sentences, setSentences, reset } =
    useMediaTranscription();
  const { currentTime, setActiveRange } = useMediaPlayer();

  const activateSentence = (sentence: TimelineEntry) => {
    setActiveRange({
      start: sentence.startTime,
      end: sentence.endTime,
      autoPlay: true,
    });
  };

  const {
    data: transcription,
    isLoading,
    error,
  } = useTranscriptionByTarget(props.targetId, props.targetType);

  useEffect(() => {
    if (!transcription) return;
    setSentences(sentencesTimeline(transcription));

    return () => {
      reset();
    };
  }, [transcription]);

  useEffect(() => {
    if (!sentences) return;
    const index = sentences.findIndex(
      (sentence) =>
        currentTime >= sentence.startTime && currentTime <= sentence.endTime
    );
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  }, [currentTime, sentences]);

  return {
    currentTime,
    sentences,
    currentIndex,
    activateSentence,
    isLoading,
    error,
  };
};

const sentencesTimeline = (
  transcription: TranscriptionEntity
): TimelineEntry[] => {
  // Flatten the timeline
  return transcription.result.timeline.flatMap((entry) => {
    if (entry.type === "sentence") {
      return [entry];
    }
    if (entry.type === "paragraph" || entry.type === "segment") {
      return (
        entry.timeline?.flatMap((subEntry) => {
          return subEntry.type === "sentence" ? [subEntry] : [];
        }) || []
      );
    }
    return [];
  });
};
