import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useChatsQuery = () => {
  return useQuery({
    queryKey: ["chats"],
    queryFn: () => {
      if (!window) {
        throw new Error("Window is not available");
      }

      return window.EnjoyAPI.db.chat.findAll();
    },
  });
};

export const useChatQuery = (chatId: string) => {
  return useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => {
      if (!window) {
        throw new Error("Window is not available");
      }

      return window.EnjoyAPI.db.chat.findById(chatId);
    },
  });
};

export const useCreateChatMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChatEntity>) => {
      return window.EnjoyAPI.db.chat.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

export const useUpdateChatMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: Partial<ChatEntity> }) => {
      const { id, data } = params;
      return window.EnjoyAPI.db.chat.update(id, data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["chat", result.id] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

export const useDeleteChatMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return window.EnjoyAPI.db.chat.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};
