import { useChatMessagesQuery } from "@renderer/hooks";
import { LoadingView, ErrorView } from "@renderer/components/status-views";

export function ChatMessages(props: { chatId: string }) {
  const { data, isLoading, error } = useChatMessagesQuery(props.chatId);

  if (isLoading) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView error={error.message} />;
  }

  return (
    <div className="flex flex-col gap-2">
      {(data?.items ?? []).map((message: ChatMessageEntity) => (
        <div key={message.id}>
          <div className="flex flex-col items-start gap-2 overflow-hidden">
            <div className="w-full bg-background rounded-lg px-4 py-2 overflow-x-auto">
              {message.content}
            </div>
            <div className="text-xs text-muted-foreground">
              {message.createdAt}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
