import { useAudioById, useTranscriptionByTarget } from "@/renderer/hooks";
import { ErrorView, LoadingView } from "@renderer/components/status-views";

export function AudioPage(props: { audioId: string }) {
  const { audioId } = props;

  const { data, isLoading, error } = useAudioById(audioId);
  const { data: transcription } = useTranscriptionByTarget(
    data?.id || "",
    "audio"
  );

  if (isLoading) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView error={error.message} />;
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">{audioId}</h1>
      </div>
    </div>
  );
}
