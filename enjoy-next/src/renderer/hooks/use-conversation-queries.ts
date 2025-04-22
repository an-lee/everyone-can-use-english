import { useMutation, useQuery } from "@tanstack/react-query";

export const useConversations = () => {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => {
      if (!window) {
        throw new Error("Window is not available");
      }

      return window.EnjoyAPI.db.conversation.findAll();
    },
  });
};

export const useConversation = (conversationId: string) => {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => {
      if (!window) {
        throw new Error("Window is not available");
      }

      return window.EnjoyAPI.db.conversation.findById(conversationId);
    },
  });
};

export const useCreateConversation = () => {
  return useMutation({
    mutationFn: (conversation: ConversationEntity) => {
      return window.EnjoyAPI.db.conversation.create(conversation);
    },
  });
};

export const useUpdateConversation = () => {
  return useMutation({
    mutationFn: (conversation: ConversationEntity) => {
      return window.EnjoyAPI.db.conversation.update(
        conversation.id,
        conversation
      );
    },
  });
};

export const useDeleteConversation = () => {
  return useMutation({
    mutationFn: (conversationId: string) => {
      return window.EnjoyAPI.db.conversation.delete(conversationId);
    },
  });
};
