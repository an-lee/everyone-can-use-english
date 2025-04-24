import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useChatAgentsQuery() {
  return useQuery({
    queryKey: ["chat-agents"],
    queryFn: () => {
      if (!window) {
        throw new Error("Window is not available");
      }

      return window.EnjoyAPI.db.chatAgent.findAll();
    },
  });
}
export function useChatAgentByIdQuery(id: string) {
  return useQuery({
    queryKey: ["chat-agent", id],
    queryFn: () => {
      if (!window) {
        throw new Error("Window is not available");
      }

      return window.EnjoyAPI.db.chatAgent.findById(id);
    },
  });
}

export function useCreateChatAgentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChatAgentEntity) => {
      return window.EnjoyAPI.db.chatAgent.create(data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chat-agents"] });
    },
  });
}

export function useUpdateChatAgentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ChatAgentEntity>;
    }) => {
      return window.EnjoyAPI.db.chatAgent.update(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chat-agents"] });
    },
  });
}

export function useDeleteChatAgentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return window.EnjoyAPI.db.chatAgent.delete(id);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chat-agents"] });
    },
  });
}
