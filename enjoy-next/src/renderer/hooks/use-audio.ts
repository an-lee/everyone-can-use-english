import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Get all audios with pagination
 */
export const useAudios = (options?: {
  page?: number;
  limit?: number;
  search?: string;
  order?: "asc" | "desc";
  sort?: "created_at" | "updated_at" | "name" | "duration" | "size";
}) => {
  return useQuery<PaginationResult<AudioEntity>>({
    queryKey: ["audios", options],
    queryFn: async () => {
      if (!window.EnjoyAPI) {
        throw new Error("EnjoyAPI not available");
      }
      return await window.EnjoyAPI.db.audio.findAll(options);
    },
  });
};

/**
 * Get a single audio by ID
 */
export const useAudioById = (id: string | null) => {
  return useQuery<AudioEntity | null>({
    queryKey: ["audio", id],
    queryFn: async () => {
      if (!id || !window.EnjoyAPI) {
        return null;
      }
      return await window.EnjoyAPI.db.audio.findById(id);
    },
    enabled: !!id,
  });
};

/**
 * Create a new audio
 */
export const createAudio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<AudioEntity>) => {
      if (!window.EnjoyAPI) {
        throw new Error("EnjoyAPI not available");
      }
      return await window.EnjoyAPI.db.audio.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audios"] });
    },
  });
};

/**
 * Update an audio
 */
export const updateAudio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<AudioEntity>;
    }) => {
      if (!window.EnjoyAPI) {
        throw new Error("EnjoyAPI not available");
      }
      return await window.EnjoyAPI.db.audio.update(id, data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["audios"] });
      queryClient.invalidateQueries({ queryKey: ["audio", data.id] });
    },
  });
};

/**
 * Delete an audio
 */
export const deleteAudio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!window.EnjoyAPI) {
        throw new Error("EnjoyAPI not available");
      }
      return await window.EnjoyAPI.db.audio.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audios"] });
    },
  });
};
