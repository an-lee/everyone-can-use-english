import { ChatMember } from "@renderer/components/chat-members";
import { Button } from "@renderer/components/ui";
import { Icon } from "@iconify/react";
import { formatDateTime } from "@renderer/lib/utils";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ChatAgentMessage(props: { message: ChatMessageEntity }) {
  const { message } = props;

  return (
    <div className="overflow-hidden">
      <div className="flex items-center gap-2 mb-1">
        <ChatMember id={message.memberId} />
      </div>
      <div className="w-full bg-background rounded-lg px-4 py-2 overflow-x-auto font-serif">
        <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center opacity-0 hover:opacity-100">
          <Button variant="ghost" size="icon" className="size-8 rounded-full">
            <Icon icon="tabler:copy" className="size-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8 rounded-full">
            <Icon icon="tabler:edit" className="size-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8 rounded-full">
            <Icon
              icon="tabler:trash"
              className="size-4 text-muted-foreground"
            />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDateTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}
