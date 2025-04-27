import { ChatAgentMessage } from "./chat-agent-message";
import { ChatUserMessage } from "./chat-user-message";
import { ChatPendingMessage } from "./chat-pending-message";

export function ChatMessages(props: { messages: ChatMessageEntity[] }) {
  const { messages = [] } = props;

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message: ChatMessageEntity) => {
        if (message.role === "USER") {
          return <ChatUserMessage key={message.id} message={message} />;
        } else if (message.state === "pending") {
          return (
            <ChatPendingMessage
              key={message.id}
              message={message}
              messages={messages}
            />
          );
        } else {
          return <ChatAgentMessage key={message.id} message={message} />;
        }
      })}
    </div>
  );
}
