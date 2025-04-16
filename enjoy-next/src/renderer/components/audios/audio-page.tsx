import { useAudioById } from "@/renderer/hooks";
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from "@renderer/components/status-views";
import { TranscriptionPanel } from "../transcriptions";
import { AudioPlayer } from "./audio-player";
import { ScrollArea } from "../ui/scroll-area";
import { useEffect } from "react";

export function AudioPage(props: { audioId: string }) {
  const { audioId } = props;

  const { data, isLoading, error } = useAudioById(audioId);

  useEffect(() => {
    if (data) {
      console.log("data", data);
      window.EnjoyAPI.plugin
        .executeCommand("ffmpeg-plugin", "getFrequencyData", [data.src])
        .then((url) => {
          console.log(url);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [data]);

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
        <div className="min-h-[calc(100svh-var(--menubar-height)-8rem)] flex flex-col">
          <TranscriptionPanel targetId={data.id || ""} targetType="Audio" />
        </div>
        <div className="h-28"></div>
      </ScrollArea>
      <div className="absolute bottom-0 left-0 w-full border-t shadow-sm bg-background h-16">
        {data && <AudioPlayer audio={data} />}
      </div>
    </div>
  );
}
