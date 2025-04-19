import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useRecordings(options?: {
  page?: number;
  limit?: number;
  search?: string;
  order?: "asc" | "desc";
  sort?: "created_at" | "updated_at" | "name" | "duration" | "size";
}) {
  return useQuery({
    queryKey: ["recordings", options],
    queryFn: async () => {
      if (!window.EnjoyAPI) {
        throw new Error("EnjoyAPI not available");
      }
      return await window.EnjoyAPI.db.recording.findAll(options);
    },
  });
}

export function useRecordingsByTarget(
  targetId: string,
  targetType: string,
  referenceId?: number
) {
  return useQuery({
    queryKey: ["recordings", targetId, targetType, referenceId],
    queryFn: async () => {
      if (!window.EnjoyAPI) {
        throw new Error("EnjoyAPI not available");
      }
      return await window.EnjoyAPI.db.recording.findByTarget(
        targetId,
        targetType,
        referenceId
      );
    },
  });
}

export function useRecording(id: string) {
  return useQuery({
    queryKey: ["recording", id],
    queryFn: async () => {
      if (!window.EnjoyAPI) {
        throw new Error("EnjoyAPI not available");
      }
      return await window.EnjoyAPI.db.recording.findById(id);
    },
  });
}

export function useCreateRecording() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<RecordingEntity>) => {
      if (!window.EnjoyAPI) {
        throw new Error("EnjoyAPI not available");
      }
      return await window.EnjoyAPI.db.recording.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordings"] });
    },
  });
}

export function useUpdateRecording() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<RecordingEntity>;
    }) => {
      if (!window.EnjoyAPI) {
        throw new Error("EnjoyAPI not available");
      }
      return await window.EnjoyAPI.db.recording.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordings"] });
    },
  });
}

export function useDeleteRecording() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!window.EnjoyAPI) {
        throw new Error("EnjoyAPI not available");
      }
      return await window.EnjoyAPI.db.recording.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordings"] });
    },
  });
}
