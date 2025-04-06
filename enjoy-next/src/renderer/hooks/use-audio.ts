import { useCallback, useState } from "react";
import type { AudioType, PaginationResult } from "@/preload/audio-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hook for working with Audio entities
 */
export const useAudio = () => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Get all audios with pagination
   */
  const useAudios = (options?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    return useQuery<PaginationResult<AudioType>>({
      queryKey: ["audios", options],
      queryFn: async () => {
        if (!window.EnjoyAPI) {
          throw new Error("EnjoyAPI not available");
        }
        return await window.EnjoyAPI.audio.findAll(options);
      },
    });
  };

  /**
   * Get a single audio by ID
   */
  const useAudioById = (id: string | null) => {
    return useQuery<AudioType | null>({
      queryKey: ["audio", id],
      queryFn: async () => {
        if (!id || !window.EnjoyAPI) {
          return null;
        }
        return await window.EnjoyAPI.audio.findById(id);
      },
      enabled: !!id,
    });
  };

  /**
   * Create a new audio
   */
  const createAudio = useMutation({
    mutationFn: async (data: Partial<AudioType>) => {
      if (!window.EnjoyAPI) {
        throw new Error("EnjoyAPI not available");
      }
      return await window.EnjoyAPI.audio.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audios"] });
    },
  });

  /**
   * Update an audio
   */
  const updateAudio = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<AudioType>;
    }) => {
      if (!window.EnjoyAPI) {
        throw new Error("EnjoyAPI not available");
      }
      return await window.EnjoyAPI.audio.update(id, data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["audios"] });
      queryClient.invalidateQueries({ queryKey: ["audio", data.id] });
    },
  });

  /**
   * Delete an audio
   */
  const deleteAudio = useMutation({
    mutationFn: async (id: string) => {
      if (!window.EnjoyAPI) {
        throw new Error("EnjoyAPI not available");
      }
      return await window.EnjoyAPI.audio.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audios"] });
    },
  });

  return {
    // Queries
    useAudios,
    useAudioById,

    // Mutations
    createAudio,
    updateAudio,
    deleteAudio,

    // State
    isLoading,
    error,
  };
};
