import { useTranscriptionControls } from "@renderer/hooks/use-transcription-controls";
import {
  DetailedTranscriptionSentence,
  TranscriptionSentence,
} from "./transcription-timeline";
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from "@renderer/components/status-views";
import { useMediaPlayerSetting } from "@renderer/store";

export function TranscriptionPanel(props: {
  targetId: string;
  targetType: string;
}) {
  const { targetId, targetType } = props;

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

  const { playMode } = useMediaPlayerSetting();

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView error={error.message} />;

  if (sentences.length === 0) return <EmptyView />;

  return (
    <div className="w-full max-w-screen-md mx-auto px-6">
      {sentences.map((sentence: TimelineEntry, index: number) =>
        playMode === "shadowMode" && index === currentIndex ? (
          <DetailedTranscriptionSentence
            key={`sentence-${index}`}
            sentence={sentence}
            index={index}
            selectWord={selectWord}
          />
        ) : (
          <TranscriptionSentence
            key={`sentence-${index}`}
            sentence={sentence}
            index={index}
            active={playMode === "readMode" && index === currentIndex}
            onClick={() => activateSentence(sentence)}
          />
        )
      )}
    </div>
  );
}
