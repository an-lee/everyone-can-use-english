import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useSpeechQueries = (options?: PaginationOptions) => {
  return useQuery({
    queryKey: ["speeches", options],
    queryFn: async () => {
      if (!window) {
        throw new Error("Window is not available");
      }

      return await window.EnjoyAPI.db.speech.findAll(options);
    },
    placeholderData: (prev) => {
      return prev;
    },
  });
};

export const useSpeechBySourceQuery = (
  sourceId: string,
  sourceType: string
) => {
  return useQuery({
    queryKey: ["speech", sourceId, sourceType],
    queryFn: async () => {
      if (!window) {
        throw new Error("Window is not available");
      }

      return await window.EnjoyAPI.db.speech.findBySource(sourceId, sourceType);
    },
  });
};

export const useCreateSpeechMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<SpeechEntity>) => {
      if (!window) {
        throw new Error("Window is not available");
      }

      return await window.EnjoyAPI.db.speech.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speeches"] });
    },
  });
};

export const useUpdateSpeechMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<SpeechEntity>;
    }) => {
      if (!window) {
        throw new Error("Window is not available");
      }

      return await window.EnjoyAPI.db.speech.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speeches"] });
    },
  });
};

export const useDeleteSpeechMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!window) {
        throw new Error("Window is not available");
      }

      return await window.EnjoyAPI.db.speech.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speeches"] });
    },
  });
};
