import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/chats/$chatId")({
  component: ChatComponent,
});

function ChatComponent() {
  const { chatId } = Route.useParams();

  return <div>Hello "/chats/{chatId}"!</div>;
}
