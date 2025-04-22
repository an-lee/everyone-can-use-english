import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/chats/")({
  component: ChatsComponent,
});

function ChatsComponent() {
  return <div className="p-2">Hello from Chats!</div>;
}
