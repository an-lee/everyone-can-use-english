import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSettingsStore } from "@renderer/store/use-settings-store";
import { useAuthStore } from "@renderer/store/use-auth-store";
import { useAppStore } from "@renderer/store/use-app-store";
import { BaseMessageLike } from "@langchain/core/messages";
import { textCommand } from "@renderer/commands/text.command";

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
    enabled: !!chatId,
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

export const useAskAgentMutation = () => {
  const { gptEngine, openai: openaiSettings } = useSettingsStore();
  const { config: appConfig } = useAppStore();
  const { currentUser } = useAuthStore();

  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      message: ChatMessageEntity;
      messages: ChatMessageEntity[];
      member: ChatMemberEntity;
    }) => {
      const { message, messages, member } = params;
      const buildPrompt = () => {
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
      };

      const engine = () => {
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
      };
      const response = await textCommand(buildPrompt(), engine());

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
            msg.id === result.id ? { ...msg, ...result } : msg
          );
        }
      );
    },
  });
};
