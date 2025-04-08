import { createFileRoute } from "@tanstack/react-router";
import { useAudios } from "@renderer/hooks/use-audio";
import { Icon } from "@iconify/react";
import { EmptyView, ErrorView } from "@renderer/components/status-views";
import { AudioCard } from "@renderer/components/audios/audio-card";

export const Route = createFileRoute("/audios")({
  component: Audios,
});

function Audios() {
  const { data, isLoading, error } = useAudios();

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Icon icon="mdi:loading" className="h-10 w-10 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorView error={error.message} />;
  }

  if (!data || data.items.length === 0) {
    return <EmptyView />;
  }

  return (
    <div className="grid w-full grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
      {data.items.map((item) => (
        <AudioCard key={item.id} audio={item} />
      ))}
    </div>
  );
}
