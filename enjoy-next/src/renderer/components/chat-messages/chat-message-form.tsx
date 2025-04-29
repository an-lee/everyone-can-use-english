import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Textarea,
} from "@renderer/components/ui";
import { Icon } from "@iconify/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import {
  useCreateChatMessageMutation,
  useChatAgentByIdQuery,
} from "@renderer/hooks";
import { useEffect } from "react";

export function ChatMessageForm(props: { chatId: string; agentId?: string }) {
  const { chatId, agentId } = props;
  const {
    mutate: createChatMessage,
    isPending,
    data: newMessage,
  } = useCreateChatMessageMutation();
  const { data: agent } = useChatAgentByIdQuery(agentId ?? "");

  const { t } = useTranslation("components/chat-messages");

  const chatMessageFormSchema = z.object({
    chatId: z.string(),
    role: z.enum(["USER", "AGENT"]),
    content: z.string().min(1, { message: t("youHaveNotInputTextYet") }),
    mentions: z.array(z.string()),
    state: z.enum(["pending", "completed"]),
  });

  const form = useForm<z.infer<typeof chatMessageFormSchema>>({
    resolver: zodResolver(chatMessageFormSchema),
    defaultValues: {
      chatId: chatId,
      role: "USER",
      content: "",
      mentions: [],
      state: "completed",
    },
  });

  const onSubmit = (data: z.infer<typeof chatMessageFormSchema>) => {
    createChatMessage(data);
  };

  useEffect(() => {
    if (newMessage) {
      form.reset();
    }
  }, [newMessage]);

  return (
    <div className="px-4 py-2 rounded-lg border bg-background shadow-md relative">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    className="w-full border-0 shadow-none focus-visible:ring-0 focus-visible:outline-0 px-2 py-1"
                    rows={2}
                    placeholder={t("messageFormPlaceholder")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        form.handleSubmit(onSubmit)();
                      }
                    }}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">{agent?.name}</div>
            <Button
              type="submit"
              disabled={isPending}
              variant="default"
              size="icon"
              className="rounded-full"
            >
              <Icon icon="tabler:send" className="size-5" />
            </Button>
          </div>
        </form>
      </Form>
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center w-full h-full z-10 bg-muted/10">
          <Icon icon="tabler:loader" className="size-5 animate-spin" />
        </div>
      )}
    </div>
  );
}
