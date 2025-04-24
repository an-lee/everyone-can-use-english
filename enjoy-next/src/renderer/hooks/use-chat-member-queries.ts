import { useQuery } from "@tanstack/react-query";

export const useChatMemberByIdQuery = (id: string) => {
  return useQuery({
    queryKey: ["chatMember", id],
    queryFn: () => {
      if (!window) {
        throw new Error("Window is not available");
      }

      return window.EnjoyAPI.db.chatMember.findById(id);
    },
  });
};
