import { useEffect, useRef } from "react";
import { ChatMember } from "../chat-members";
import { useAskAgentMutation } from "@renderer/hooks";
import { Icon } from "@iconify/react";
import { useChatMemberByIdQuery } from "@renderer/hooks";
import { Button } from "@renderer/components/ui";
import { formatDateTime } from "@renderer/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import debounce from "lodash/debounce";

export function ChatPendingMessage(props: {
  message: ChatMessageEntity;
  messages: ChatMessageEntity[];
}) {
  const { message, messages } = props;
  const { t } = useTranslation("components/chat-messages");
  const { data: member, isPending: isMemberPending } = useChatMemberByIdQuery(
    message.memberId
  );
  const { mutate, isPending, error } = useAskAgentMutation();
  const ref = useRef<HTMLDivElement>(null);

  const askAgent = () => {
    if (isMemberPending) return;
    if (isPending) return;
    if (message.state !== "pending") return;

    mutate({
      message,
      messages,
      member,
    });
  };
  const debouncedAskAgent = debounce(askAgent, 500);

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  useEffect(() => {
    if (isMemberPending) return;

    debouncedAskAgent();
  }, [isMemberPending]);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollIntoView({ behavior: "smooth" });
  }, [ref.current]);

  return (
    <div ref={ref} className="overflow-hidden">
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
            <Button
              onClick={() => debouncedAskAgent()}
              variant="ghost"
              className=""
            >
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
