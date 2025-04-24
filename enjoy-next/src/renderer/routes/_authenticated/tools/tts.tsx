import { createFileRoute } from "@tanstack/react-router";
import { TTSPage } from "@renderer/components/tools";

export const Route = createFileRoute("/_authenticated/tools/tts")({
  component: TTSPage,
});
