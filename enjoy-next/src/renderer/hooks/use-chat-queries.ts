import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useChats = () => {
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

export const useChat = (chatId: string) => {
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

export const useCreateChat = () => {
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

export const useUpdateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: Partial<ChatEntity> }) => {
      const { id, data } = params;
      return window.EnjoyAPI.db.chat.update(id, data);
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData(["chats"], (oldData: ChatEntity[]) => {
        return oldData.map((chat) =>
          chat.id === variables.id ? { ...chat, ...result } : chat
        );
      });
      queryClient.invalidateQueries({ queryKey: ["chat", variables.id] });
    },
  });
};

export const useDeleteChat = () => {
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
