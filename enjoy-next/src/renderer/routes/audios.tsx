import { createFileRoute } from "@tanstack/react-router";
import { useAudios } from "@renderer/hooks/use-audio";
import { Icon } from "@iconify/react";
import { ErrorView } from "../components/status-views";

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

  if (data) {
    return (
      <div className="p-2">
        {data.items.map((item) => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>
    );
  }

  return <div className="p-2">Hello from Audios!</div>;
}
