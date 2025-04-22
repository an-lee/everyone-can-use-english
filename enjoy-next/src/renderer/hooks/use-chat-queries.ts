import { useMutation, useQuery } from "@tanstack/react-query";

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
  return useMutation({
    mutationFn: (chat: ChatEntity) => {
      return window.EnjoyAPI.db.chat.create(chat);
    },
  });
};

export const useUpdateChat = () => {
  return useMutation({
    mutationFn: (chat: ChatEntity) => {
      return window.EnjoyAPI.db.chat.update(chat.id, chat);
    },
  });
};

export const useDeleteChat = () => {
  return useMutation({
    mutationFn: (chatId: string) => {
      return window.EnjoyAPI.db.chat.delete(chatId);
    },
  });
};
