import { useEffect } from "react";
import { ChatMember } from "../chat-members";
import { useAskAgentMutation } from "@renderer/hooks";
import { Icon } from "@iconify/react";
import { Button } from "../ui";
import { formatDateTime } from "@renderer/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useDebounce } from "@uidotdev/usehooks";

export function ChatPendingMessage(props: {
  message: ChatMessageEntity;
  messages: ChatMessageEntity[];
}) {
  const { message, messages } = props;
  const { t } = useTranslation("components/chat-messages");
  const {
    mutate: askAgent,
    isPending,
    error,
  } = useAskAgentMutation({
    message,
    messages,
  });

  const debouncedAskAgent = useDebounce(askAgent, 500);

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  useEffect(() => {
    if (isPending) return;

    debouncedAskAgent();
  }, [message?.id]);

  return (
    <div className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-1">
        <ChatMember id={message.memberId} />
      </div>
      {isPending ? (
        <div className="overflow-x-auto flex">
          <div className="bg-background rounded-lg px-4 py-2 flex items-center gap-2">
            <Icon icon="tabler:loader" className="size-4 animate-spin" />
            <span className="text-sm">{t("loading")}</span>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto flex">
          <div className="bg-background rounded-lg">
            <Button onClick={() => askAgent()} variant="ghost" className="">
              <Icon icon="tabler:refresh" className="size-5" />
              <span className="text-sm">{t("retry")}</span>
            </Button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center"></div>
        <div className="text-xs text-muted-foreground">
          {formatDateTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}
