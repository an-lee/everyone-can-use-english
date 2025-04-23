import { createFileRoute } from "@tanstack/react-router";
import { ChatPage } from "@renderer/components/chats";

export const Route = createFileRoute("/_authenticated/chats/$chatId")({
  component: () => <ChatPage chatId={Route.useParams().chatId} />,
});
