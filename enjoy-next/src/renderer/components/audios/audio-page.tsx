import { useAudioById } from "@/renderer/hooks";
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from "@renderer/components/status-views";
import { TranscriptionPanel } from "../transcriptions";
import { AudioPlayer } from "./audio-player";
import { ScrollArea } from "../ui/scroll-area";

export function AudioPage(props: { audioId: string }) {
  const { audioId } = props;

  const { data, isLoading, error } = useAudioById(audioId);

  if (isLoading) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView error={error.message} />;
  }

  if (!data) {
    return <EmptyView />;
  }

  return (
    <div className="w-full flex flex-col relative h-[calc(100svh-var(--menubar-height))] overflow-hidden bg-muted/50">
      <ScrollArea className="flex-1">
        <div className="h-4"></div>
        <TranscriptionPanel targetId={data.id || ""} targetType="Audio" />
        <div className="h-28"></div>
      </ScrollArea>
      <div className="absolute bottom-0 left-0 w-full border-t shadow-sm bg-background h-14">
        {data && <AudioPlayer audio={data} />}
      </div>
    </div>
  );
}
