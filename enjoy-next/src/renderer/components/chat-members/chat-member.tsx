import { useChatMemberByIdQuery } from "@renderer/hooks";

export function ChatMember(props: { id: string }) {
  const { id } = props;

  const { data } = useChatMemberByIdQuery(id);

  if (!data) {
    return null;
  }

  if (data.config.gpt) {
    return (
      <>
        {data.agent && (
          <div className="text-sm text-muted-foreground font-serif">
            {data.agent.name}-{data.agent.type}
          </div>
        )}
        <div className="text-sm text-muted-foreground font-serif">
          {data.config.gpt?.engine} | {data.config.gpt?.model}
        </div>
      </>
    );
  } else if (data.config.tts) {
    return (
      <div className="text-sm text-muted-foreground font-serif">
        {data.config.tts?.engine} | {data.config.tts?.model}
      </div>
    );
  } else {
    return null;
  }
}
