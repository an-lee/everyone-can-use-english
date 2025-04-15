import { useEffect } from "react";
import { useMediaPlayer } from "../store/use-media-player";
import { useMediaTranscription } from "../store/use-media-transcription";
import { useTranscriptionByTarget } from "./use-transcription";

export const useTranscriptionControls = (props: {
  targetId: string;
  targetType: string;
}) => {
  const {
    currentIndex,
    setCurrentIndex,
    sentences,
    setSentences,
    selectedWords,
    setSelectedWords,
    reset,
  } = useMediaTranscription();
  const { currentTime, setActiveRange } = useMediaPlayer();

  const activateSentence = (sentence: TimelineEntry) => {
    setActiveRange({
      start: sentence.startTime,
      end: sentence.endTime,
      autoPlay: true,
    });
  };

  const selectWord = (wordIndex: number) => {
    if (selectedWords.includes(wordIndex)) {
      // If the word is already selected, and the word is the first or last word, remove it from the selected words
      if (
        wordIndex === Math.min(...selectedWords) ||
        wordIndex === Math.max(...selectedWords)
      ) {
        setSelectedWords(selectedWords.filter((word) => word !== wordIndex));
      }
    } else {
      // If the word is not selected, add it to the selected, and ensure every word index between the min index and the max index is also selected
      const minIndex = Math.min(...selectedWords, wordIndex);
      const maxIndex = Math.max(...selectedWords, wordIndex);
      const newSelectedWords = [];
      for (let i = minIndex; i <= maxIndex; i++) {
        newSelectedWords.push(i);
      }
      setSelectedWords(newSelectedWords);
    }
  };

  const {
    data: transcription,
    isLoading,
    error,
  } = useTranscriptionByTarget(props.targetId, props.targetType);

  useEffect(() => {
    if (!transcription) return;

    setSentences(timelineToSentences(transcription));

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

  /*
   * This effect is used to set the active range to the selected words
   */
  useEffect(() => {
    if (!sentences) return;

    const currentSentence = sentences[currentIndex];
    if (!currentSentence?.timeline) return;

    const firstWord = currentSentence.timeline[Math.min(...selectedWords)];
    const lastWord = currentSentence.timeline[Math.max(...selectedWords)];

    if (firstWord && lastWord) {
      setActiveRange({
        start: firstWord.startTime,
        end: lastWord.endTime,
        autoPlay: false,
      });
    } else {
      setActiveRange({
        start: currentSentence.startTime,
        end: currentSentence.endTime,
        autoPlay: false,
      });
    }
  }, [selectedWords]);

  /*
   * This effect is used to reset the selected words when the current index changes
   */
  useEffect(() => {
    setSelectedWords([]);
  }, [currentIndex]);

  return {
    currentTime,
    sentences,
    currentIndex,
    activateSentence,
    isLoading,
    error,
    selectWord,
  };
};

const timelineToSentences = (
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
