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

  /*
   * This effect is used to find the index of the sentence that is currently being spoken
   * If the current time is between the start and end of the sentence, set the current index to the sentence
   */
  useEffect(() => {
    if (!sentences) return;

    let index = sentences.findIndex(
      (sentence) => currentTime >= sentence.startTime
    );

    if (index < 0) return;

    for (let i = index; i < sentences.length; i++) {
      if (currentTime >= sentences[i].startTime) {
        index = i;
      } else {
        break;
      }
    }

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
  return (transcription.result.timeline || []).flatMap((entry) => {
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
