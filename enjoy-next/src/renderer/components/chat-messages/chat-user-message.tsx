import { formatDateTime } from "@/renderer/lib/utils";
import { Button } from "../ui/button";
import { Icon } from "@iconify/react";

export function ChatUserMessage(props: { message: ChatMessageEntity }) {
  const { message } = props;
  return (
    <div className="overflow-hidden">
      <div className="w-full bg-transparent overflow-x-auto font-serif text-lg mb-2">
        {message.content}
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
