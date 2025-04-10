import { AudioPage } from "@renderer/components/audios";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/audios/$audioId")({
  component: AudioPage,
});
