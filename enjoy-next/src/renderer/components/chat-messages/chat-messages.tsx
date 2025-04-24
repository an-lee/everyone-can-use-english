import { useChatMessagesQuery } from "@renderer/hooks";
import { LoadingView, ErrorView } from "@renderer/components/status-views";
import { ChatAgent } from "../chat-agents/chat-agent";
import { ChatMessage } from "./chat-message";

export function ChatMessages(props: { chatId: string }) {
  const { data, isLoading, error } = useChatMessagesQuery(props.chatId);

  if (isLoading) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView error={error.message} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {(data || []).map((message: ChatMessageEntity) => (
        <ChatMessage key={message.id} message={message} />
      ))}
    </div>
  );
}
