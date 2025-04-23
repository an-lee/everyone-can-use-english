import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

      queryClient.setQueryData(
        ["chat-messages", result.chatId],
        (oldData: ChatMessageEntity[]) => {
          return [...oldData, result];
        }
      );
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
