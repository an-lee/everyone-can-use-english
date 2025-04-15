import { useTranscriptionControls } from "@/renderer/hooks/use-transcription-controls";
import {
  TranscriptionActiveSentence,
  TranscriptionSentence,
} from "./transcription-timeline";

export function TranscriptionPanel(props: {
  targetId: string;
  targetType: string;
}) {
  const { targetId, targetType } = props;

  const { sentences, isLoading, error, currentIndex, activateSentence } =
    useTranscriptionControls({
      targetId,
      targetType,
    });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className="w-full max-w-screen-md mx-auto px-6">
      {sentences.map((sentence: TimelineEntry, index: number) =>
        index === currentIndex ? (
          <TranscriptionActiveSentence
            key={`sentence-${index}`}
            sentence={sentence}
            index={index}
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
