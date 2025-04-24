import { ChatAgentMessage } from "./chat-agent-message";
import { ChatUserMessage } from "./chat-user-message";

export function ChatMessage(props: { message: ChatMessageEntity }) {
  const { message } = props;

  if (message.role === "USER") {
    return <ChatUserMessage message={message} />;
  } else if (message.role === "AGENT") {
    return <ChatAgentMessage message={message} />;
  } else {
    return null;
  }
}
