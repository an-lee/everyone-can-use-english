import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Get a single transcription by target
 */
export const useTranscriptionByTarget = (
  targetId: string,
  targetType: string
) => {
  return useQuery<TranscriptionEntity | null>({
    queryKey: ["transcription", targetId, targetType],
    queryFn: async () => {
      if (!targetId || !targetType || !window.EnjoyAPI) {
        return null;
      }
      return await window.EnjoyAPI.db.transcription.findByTarget(
        targetId,
        targetType
      );
    },
    enabled: !!targetId && !!targetType,
  });
};

/**
 * Create a new audio
 */
export const createTranscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<TranscriptionEntity>) => {
      if (!window.EnjoyAPI) {
        throw new Error("EnjoyAPI not available");
      }
      return await window.EnjoyAPI.db.transcription.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transcriptions"] });
    },
  });
};

/**
 * Update an audio
 */
export const updateTranscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TranscriptionEntity>;
    }) => {
      if (!window.EnjoyAPI) {
        throw new Error("EnjoyAPI not available");
      }
      return await window.EnjoyAPI.db.transcription.update(id, data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["transcriptions"] });
      queryClient.invalidateQueries({ queryKey: ["transcription", data.id] });
    },
  });
};

/**
 * Delete an audio
 */
export const deleteTranscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!window.EnjoyAPI) {
        throw new Error("EnjoyAPI not available");
      }
      return await window.EnjoyAPI.db.transcription.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transcriptions"] });
    },
  });
};
