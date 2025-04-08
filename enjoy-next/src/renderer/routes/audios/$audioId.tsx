import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/audios/$audioId")({
  component: AudioComponent,
});

function AudioComponent() {
  const { audioId } = Route.useParams();

  return <div>Hello "/audios/{audioId}"!</div>;
}
