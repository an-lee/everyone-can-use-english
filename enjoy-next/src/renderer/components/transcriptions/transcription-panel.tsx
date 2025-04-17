import { useTranscriptionControls } from "@renderer/hooks/use-transcription-controls";
import {
  TranscriptionActiveSentence,
  TranscriptionSentence,
} from "./transcription-timeline";
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from "@renderer/components/status-views";
import { useMediaFrequencies } from "@/renderer/hooks";
import { useMediaPlayer } from "@/renderer/store/use-media-player";

export function TranscriptionPanel(props: {
  targetId: string;
  targetType: string;
}) {
  const { targetId, targetType } = props;
  const { mediaElement } = useMediaPlayer();

  const {
    sentences,
    isLoading,
    error,
    currentIndex,
    activateSentence,
    selectWord,
  } = useTranscriptionControls({
    targetId,
    targetType,
  });

  const {
    data: frequenciesData,
    isLoading: frequenciesLoading,
    error: frequenciesError,
  } = useMediaFrequencies(mediaElement?.src || "");

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView error={error.message} />;

  if (sentences.length === 0) return <EmptyView />;

  return (
    <div className="w-full max-w-screen-md mx-auto px-6">
      {sentences.map((sentence: TimelineEntry, index: number) =>
        index === currentIndex ? (
          <TranscriptionActiveSentence
            key={`sentence-${index}`}
            sentence={sentence}
            index={index}
            selectWord={selectWord}
            frequenciesData={
              frequenciesData && {
                frequencies: frequenciesData?.frequencies || [],
                metadata: {
                  duration: frequenciesData?.metadata.duration,
                },
              }
            }
          />
        ) : (
          <TranscriptionSentence
            key={`sentence-${index}`}
            sentence={sentence}
            index={index}
            onClick={() => activateSentence(sentence)}
          />
        )
      )}
    </div>
  );
}
