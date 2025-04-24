import { useChatAgentByIdQuery } from "@renderer/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export function ChatAgent(props: { id: string; type: "avatar" | "name" }) {
  const { id, type } = props;

  const { data, isLoading, error } = useChatAgentByIdQuery(id);

  if (isLoading) {
    return <div className="size-4 bg-muted/50 rounded-full animate-pulse" />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data) {
    return null;
  }

  if (type === "avatar") {
    return (
      <Avatar className="w-6 h-6">
        <AvatarImage src={data.avatar} />
        <AvatarFallback>{data.name.charAt(0)}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div className="text-sm text-muted-foreground font-serif">
      {data.name}-{data.type}
    </div>
  );
}
