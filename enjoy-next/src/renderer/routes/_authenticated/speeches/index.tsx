import { SpeechesPage } from "@renderer/components/speeches";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/speeches/")({
  component: SpeechesPage,
});
