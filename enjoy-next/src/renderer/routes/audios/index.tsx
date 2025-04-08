import { createFileRoute } from "@tanstack/react-router";
import { AudiosPage } from "@/renderer/components/audios";

export const Route = createFileRoute("/audios/")({
  component: AudiosPage,
});
