import { useAudioByIdQuery } from "@renderer/hooks";
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from "@renderer/components/status-views";
import { TranscriptionPanel } from "@renderer/components/transcriptions";
import { AudioPlayer } from "@renderer/components/audios";
import { ScrollArea } from "@renderer/components/ui/scroll-area";

export function AudioPage(props: { audioId: string }) {
  const { audioId } = props;

  const { data, isLoading, error } = useAudioByIdQuery(audioId);

  if (isLoading) {
    return (
      <div className="h-content">
        <LoadingView />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-content">
        <ErrorView error={error.message} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-content">
        <EmptyView />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col relative h-content overflow-hidden bg-muted/50">
      <ScrollArea className="flex-1">
        <div className="h-4"></div>
        <div className="min-h-[calc(100svh-var(--menubar-height)-8rem)] flex flex-col">
          <TranscriptionPanel targetId={data.id} targetType="Audio" />
        </div>
        <div className="h-28"></div>
      </ScrollArea>
      <div className="absolute bottom-0 left-0 w-full border-t shadow-sm bg-background h-16 z-10">
        {data && <AudioPlayer audio={data} />}
      </div>
    </div>
  );
}
