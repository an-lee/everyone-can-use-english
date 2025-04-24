import { useChat } from "@renderer/hooks";
import { LoadingView, ErrorView } from "@renderer/components/status-views";
import { ChatForm } from "@renderer/components/chats";
import { ChatMessages } from "@renderer/components/chat-messages/chat-messages";
import { ScrollArea } from "@renderer/components/ui";

export function ChatPage({ chatId }: { chatId: string }) {
  const { data, isLoading, error } = useChat(chatId);

  if (isLoading) {
    return (
      <div className="h-content">
        <LoadingView />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-content">
        <ErrorView error={error.message} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col relative h-content overflow-hidden bg-muted">
      <ScrollArea className="flex-1">
        <div className="h-4"></div>
        <div className="min-h-[calc(100svh-var(--menubar-height)-8rem)] flex flex-col w-full sm:max-w-screen-sm mx-auto">
          <div className="px-4">
            <ChatMessages chatId={chatId} />
          </div>
        </div>
        <div className="h-48" />
      </ScrollArea>
      <div className="absolute bottom-4 left-0 w-full px-4">
        <div className="w-full max-w-screen-sm mx-auto">
          <ChatForm />
        </div>
      </div>
    </div>
  );
}
