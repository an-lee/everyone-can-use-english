import { useTranscriptionByTarget } from "@/renderer/hooks/use-transcription";
import { TranscriptionTimeline } from "./transcription-timeline";

export function TranscriptionPanel(props: {
  targetId: string;
  targetType: string;
}) {
  const { targetId, targetType } = props;

  const {
    data: transcription,
    isLoading,
    isError,
    error,
  } = useTranscriptionByTarget(targetId, targetType);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>{error.message}</div>;

  return (
    <div className="w-full max-w-screen-md mx-auto px-6">
      {transcription && (
        <TranscriptionTimeline timeline={transcription.result.timeline} />
      )}
    </div>
  );
}
