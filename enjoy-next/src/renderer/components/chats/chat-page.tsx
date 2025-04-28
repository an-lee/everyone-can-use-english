import { useChat, useChatMessagesQuery, useUpdateChat } from "@renderer/hooks";
import { LoadingView, ErrorView } from "@renderer/components/status-views";
import {
  ChatMessageForm,
  ChatMessages,
} from "@renderer/components/chat-messages";
import { Button, Input, ScrollArea } from "@renderer/components/ui";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { summarizeTopicCommand } from "@renderer/commands";
import { useSettingsStore } from "@renderer/store/use-settings-store";
import { cn } from "@renderer/lib/utils";
import { useState } from "react";

export function ChatPage({ chatId }: { chatId: string }) {
  const { data, isLoading, error } = useChat(chatId);
  const { data: messages } = useChatMessagesQuery(chatId);
  const { mutate: updateChat } = useUpdateChat();
  const { currentGptEngine } = useSettingsStore();

  const [updatingName, setUpdatingName] = useState(false);
  const [editing, setEditing] = useState(false);

  const generateChatName = async () => {
    const gptOptions = currentGptEngine();
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
      setUpdatingName(true);
      const topic = await summarizeTopicCommand(content, {
        key: gptOptions.key,
        baseUrl: gptOptions.baseUrl,
        model: gptOptions.models.default,
      });
      if (topic) {
        await updateChat({ id: chatId, data: { name: topic } });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setUpdatingName(false);
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
        <div className="flex items-center justify-center my-2">
          <Button
            variant="ghost"
            size="icon"
            className="opacity-10 hover:opacity-100"
            onClick={generateChatName}
            disabled={updatingName}
          >
            <Icon
              icon="tabler:refresh"
              className={cn(
                "transition-transform duration-300",
                updatingName ? "animate-spin" : ""
              )}
            />
          </Button>
          <div className="max-w-32 truncate">
            {editing ? (
              <Input
                defaultValue={data?.name}
                onBlur={(e) => {
                  setUpdatingName(true);
                  updateChat(
                    { id: chatId, data: { name: e.target.value } },
                    {
                      onError: (error) => {
                        toast.error(
                          error instanceof Error ? error.message : String(error)
                        );
                      },
                      onSettled: () => {
                        setUpdatingName(false);
                        setEditing(false);
                      },
                    }
                  );
                }}
              />
            ) : (
              <span className="text-sm text-muted-foreground max-w-full">
                {data?.name}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-10 hover:opacity-100"
            disabled={editing}
            onClick={() => setEditing(true)}
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
