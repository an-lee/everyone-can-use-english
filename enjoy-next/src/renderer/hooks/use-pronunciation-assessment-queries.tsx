import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function usePronunciationAssessmentQuery(props: {
  targetId: string;
  targetType: string;
}) {
  const { targetId, targetType } = props;

  return useQuery({
    queryKey: ["pronunciation-assessment", targetId, targetType],
    queryFn: async () => {
      if (!window.EnjoyAPI) {
        throw new Error("EnjoyAPI not available");
      }
      return await window.EnjoyAPI.db.pronunciationAssessment.findByTarget(
        targetId,
        targetType
      );
    },
  });
}

export function useCreatePronunciationAssessmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PronunciationAssessmentEntity) => {
      return await window.EnjoyAPI.db.pronunciationAssessment.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pronunciation-assessment"] });
    },
  });
}

export function useUpdatePronunciationAssessmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PronunciationAssessmentEntity) => {
      return await window.EnjoyAPI.db.pronunciationAssessment.update(
        data.id,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pronunciation-assessment"] });
    },
  });
}

export function useDeletePronunciationAssessmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await window.EnjoyAPI.db.pronunciationAssessment.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pronunciation-assessment"] });
    },
  });
}
