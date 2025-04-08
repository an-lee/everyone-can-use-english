import { createFileRoute } from "@tanstack/react-router";
import { useAudios } from "@renderer/hooks/use-audio";
import { Icon } from "@iconify/react";
import { EmptyView, ErrorView } from "@renderer/components/status-views";
import { AudioCard } from "@renderer/components/audios/audio-card";
import { LoadingView } from "@/renderer/components/status-views/loading-view";
import { Button, Input } from "@/renderer/components/ui";
import { useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";

export const Route = createFileRoute("/audios/")({
  component: AudiosComponent,
});

function AudiosComponent() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const { data, isLoading, error } = useAudios({
    search: debouncedQuery,
  });

  if (isLoading) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView error={error.message} />;
  }

  if (!data || data.items.length === 0) {
    return <EmptyView />;
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button>
          <Icon icon="mdi:plus" />
          Add Audio
        </Button>
      </div>
      <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {data.items.map((item) => (
          <AudioCard key={item.id} audio={item} />
        ))}
      </div>
    </div>
  );
}
