import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSettingsStore } from "../store/use-settings-store";
import { useAuthStore } from "../store/use-auth-store";
import { useChatMemberByIdQuery } from "./use-chat-member-queries";
import { useAppStore } from "../store/use-app-store";
import { BaseMessageLike } from "@langchain/core/messages";
import { useMemo } from "react";
import { textCommand } from "../commands/text.command";

export const useChatMessagesQuery = (chatId: string) => {
  return useQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: () => {
      if (!window) {
        throw new Error("Window is not available");
      }

      return window.EnjoyAPI.db.chatMessage.findAll({
        chat_id: chatId,
      });
    },
  });
};

export const useCreateChatMessageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ChatMessageEntity>) => {
      if (!window) {
        throw new Error("Window is not available");
      }

      return window.EnjoyAPI.db.chatMessage.create(data);
    },
    onSuccess: (result) => {
      if (!result.chatId) return;

      queryClient.invalidateQueries({
        queryKey: ["chat-messages", result.chatId],
      });
    },
  });
};

export const useUpdateChatMessageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ChatMessageEntity>;
    }) => {
      if (!window) {
        throw new Error("Window is not available");
      }

      return window.EnjoyAPI.db.chatMessage.update(id, data);
    },
    onSuccess: (result, variables) => {
      if (!result.chatId) return;

      queryClient.setQueryData(
        ["chat-messages", result.chatId],
        (oldData: ChatMessageEntity[]) => {
          return oldData.map((message) =>
            message.id === variables.id ? { ...message, ...result } : message
          );
        }
      );
    },
  });
};

export const useDeleteChatMessageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      if (!window) {
        throw new Error("Window is not available");
      }

      return window.EnjoyAPI.db.chatMessage.delete(id);
    },
    onSuccess: (result, variables) => {
      if (!result.chatId) return;

      queryClient.setQueryData(
        ["chat-messages", result.chatId],
        (oldData: ChatMessageEntity[]) => {
          return oldData.filter((message) => message.id !== variables);
        }
      );
    },
  });
};

export const useAskAgentMutation = (props: {
  message: ChatMessageEntity;
  messages: ChatMessageEntity[];
}) => {
  const { message, messages } = props;
  const { gptEngine, openai: openaiSettings } = useSettingsStore();
  const { config: appConfig } = useAppStore();
  const { currentUser } = useAuthStore();
  const { data: member } = useChatMemberByIdQuery(props.message.memberId);

  const buildPrompt = useMemo((): BaseMessageLike[] => {
    const prompt: BaseMessageLike[] = [];
    if (member?.agent?.config?.prompt) {
      prompt.push(["system", member.agent.config.prompt]);
    }

    if (member?.config?.prompt) {
      prompt.push(["system", member.config.prompt]);
    }

    for (const m of messages) {
      if (m.id === message.id) {
        break;
      }
      if (m.state !== "completed") {
        continue;
      }

      if (m.role === "USER") {
        prompt.push(["user", m.content]);
      } else if (m.role === "AGENT") {
        prompt.push(["assistant", m.content]);
      }
    }

    return prompt;
  }, [messages, member]);

  const engine = useMemo(() => {
    if (gptEngine.name === "openai" && openaiSettings.key) {
      return {
        key: openaiSettings.key,
        model: gptEngine.models["default"],
        baseUrl: appConfig.webApiUrl,
      };
    }
    return {
      key: currentUser?.accessToken || "",
      model: gptEngine.models["default"],
      baseUrl: `${appConfig.webApiUrl}/api/ai`,
    };
  }, [gptEngine, openaiSettings, currentUser, appConfig]);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await textCommand(buildPrompt, engine);
      return window.EnjoyAPI.db.chatMessage.update(message.id, {
        content: response,
        state: "completed",
      });
    },
    onSuccess: (result) => {
      if (!result.chatId) return;

      queryClient.setQueryData(
        ["chat-messages", result.chatId],
        (oldData: ChatMessageEntity[]) => {
          return oldData.map((msg) =>
            msg.id === message.id ? { ...msg, ...result } : msg
          );
        }
      );
    },
  });
};
