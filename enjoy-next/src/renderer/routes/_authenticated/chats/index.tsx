import { createFileRoute } from "@tanstack/react-router";
import { ChatsPage } from "@renderer/components/chats";

export const Route = createFileRoute("/_authenticated/chats/")({
  component: ChatsPage,
});
