import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { completeStudySubtopic, createStudySubtopic, createStudyTopic, deleteStudySubtopic, deleteStudyTopic, listStudyTopics } from "@/lib/api";
import type { StudySubtopicPayload, StudyTopicPayload } from "@/types/study";

export function useStudyTopics() {
  return useQuery({
    queryKey: ["study-topics"],
    queryFn: listStudyTopics,
  });
}

export function useStudyMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["study-topics"] });

  const createTopic = useMutation({
    mutationFn: (payload: StudyTopicPayload) => createStudyTopic(payload),
    onSuccess: () => {
      toast.success("Trilha criada");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const createSubtopic = useMutation({
    mutationFn: ({ topicId, payload }: { topicId: number; payload: StudySubtopicPayload }) => createStudySubtopic(topicId, payload),
    onSuccess: () => {
      toast.success("Assunto adicionado");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const completeSubtopic = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) => completeStudySubtopic(id, completed),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const removeTopic = useMutation({
    mutationFn: deleteStudyTopic,
    onSuccess: () => {
      toast.success("Trilha removida");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const removeSubtopic = useMutation({
    mutationFn: deleteStudySubtopic,
    onSuccess: () => {
      toast.success("Assunto removido");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  return { createTopic, createSubtopic, completeSubtopic, removeTopic, removeSubtopic };
}
