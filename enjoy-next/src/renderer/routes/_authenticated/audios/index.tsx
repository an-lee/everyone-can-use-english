import { createFileRoute } from "@tanstack/react-router";
import { AudiosPage } from "@/renderer/components/audios";

export const Route = createFileRoute("/_authenticated/audios/")({
  component: AudiosPage,
});
