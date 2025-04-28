import { useChat, useChatMessagesQuery, useUpdateChat } from "@renderer/hooks";
import { LoadingView, ErrorView } from "@renderer/components/status-views";
import {
  ChatMessageForm,
  ChatMessages,
} from "@renderer/components/chat-messages";
import { Button, ScrollArea } from "@renderer/components/ui";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { summarizeTopicCommand } from "@renderer/commands";
import { useSettingsStore } from "@renderer/store/use-settings-store";
import { useAppStore } from "@renderer/store/use-app-store";
import { cn } from "@renderer/lib/utils";

export function ChatPage({ chatId }: { chatId: string }) {
  const { data, isLoading, error } = useChat(chatId);
  const { data: messages } = useChatMessagesQuery(chatId);
  const { mutate: updateChat, isPending: isUpdatingChat } = useUpdateChat();
  const { currentGptEngine, learningLanguage, language } = useSettingsStore();
  const { config: appConfig } = useAppStore();

  const generateChatName = async () => {
    const gptOptions = currentGptEngine();
    console.log(gptOptions);
    console.log(learningLanguage, language);
    if (
      messages?.filter((m: ChatMessageEntity) => m.role === "AGENT").length < 1
    )
      return;

    const content = messages
      .filter((m: ChatMessageEntity) => m.role === "AGENT" || m.role === "USER")
      .slice(0, 10)
      .map((m: ChatMessageEntity) => m.content)
      .join("\n");
    try {
      const topic = await summarizeTopicCommand(content, {
        key: gptOptions.key,
        baseUrl: gptOptions.baseUrl,
        model: gptOptions.models.default || "gpt-4.1-nano",
      });
      if (topic) {
        updateChat({ id: chatId, data: { name: topic } });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

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
        <div className="flex items-center justify-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="opacity-10 hover:opacity-100"
            onClick={generateChatName}
          >
            <Icon
              icon="tabler:refresh"
              className={cn(
                "transition-transform duration-300",
                isUpdatingChat ? "animate-spin" : ""
              )}
            />
          </Button>
          <div className="text-sm text-muted-foreground max-w-24 truncate">
            {data?.name}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-10 hover:opacity-100"
          >
            <Icon icon="tabler:pencil" />
          </Button>
        </div>
        <div className="min-h-[calc(100svh-var(--menubar-height)-8rem)] flex flex-col w-full sm:max-w-screen-sm mx-auto">
          <div className="px-4">
            <ChatMessages messages={messages} />
          </div>
        </div>
        <div className="h-48" />
      </ScrollArea>
      <div className="absolute bottom-4 left-0 w-full px-4">
        <div className="w-full max-w-screen-sm mx-auto">
          <ChatMessageForm chatId={chatId} />
        </div>
      </div>
    </div>
  );
}
