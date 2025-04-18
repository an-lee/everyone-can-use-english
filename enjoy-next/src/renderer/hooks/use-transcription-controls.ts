import { useEffect, useMemo } from "react";
import {
  useMediaPlayBack,
  useMediaTranscription,
  useMediaPlayerSetting,
} from "@renderer/store";
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
  const { currentTime, activeRange, setActiveRange, directSeek } =
    useMediaPlayBack();
  const { playMode } = useMediaPlayerSetting();

  const activateSentence = (sentence: TimelineEntry) => {
    if (playMode === "shadowMode") {
      setActiveRange({
        start: sentence.startTime,
        end: sentence.endTime,
        autoPlay: true,
      });
    } else {
      directSeek(sentence.startTime);
    }
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

  // Memoize the sentence time boundaries for efficient lookup
  const sentenceTimeIndices = useMemo(() => {
    if (!sentences || sentences.length === 0) return [];

    // Create an array of sentence start times with their indices
    return sentences
      .map((sentence, index) => ({
        time: sentence.startTime,
        index,
      }))
      .sort((a, b) => a.time - b.time);
  }, [sentences]);

  /*
   * This effect is used to find the index of the sentence that is currently being spoken
   * Using binary search for more efficient lookup
   */
  useEffect(() => {
    if (!sentences || sentences.length === 0 || !sentenceTimeIndices.length)
      return;

    // Binary search to find the largest sentence start time that is <= currentTime
    let left = 0;
    let right = sentenceTimeIndices.length - 1;
    let foundIndex = -1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (sentenceTimeIndices[mid].time <= currentTime) {
        foundIndex = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    // If we found a valid index, update the current index
    if (foundIndex !== -1) {
      const newIndex = sentenceTimeIndices[foundIndex].index;
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }
  }, [currentTime, sentenceTimeIndices, currentIndex]);

  /*
   * This effect is used to set the active range to the selected words
   */
  useEffect(() => {
    if (!sentences || sentences.length === 0) return;

    const currentSentence = sentences[currentIndex];
    if (!currentSentence?.timeline) return;

    // Only calculate this if there are selected words
    if (selectedWords.length > 0) {
      const firstWord = currentSentence.timeline[Math.min(...selectedWords)];
      const lastWord = currentSentence.timeline[Math.max(...selectedWords)];
      if (!firstWord || !lastWord) return;

      if (
        activeRange.start === firstWord.startTime &&
        activeRange.end === lastWord.endTime
      )
        return;

      setActiveRange({
        start: firstWord.startTime,
        end: lastWord.endTime,
        autoPlay: false,
      });
    } else if (playMode === "shadowMode") {
      // Default to the whole sentence if no words are selected
      setActiveRange({
        start: currentSentence.startTime,
        end: currentSentence.endTime,
        autoPlay: false,
      });
    }
  }, [selectedWords, sentences]);

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

// Memoize the timeline processing to avoid unnecessary recalculations
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
