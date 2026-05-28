import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { completeOccurrence, createActivity, deleteActivity, deleteAllActivities, listWeek, moveOccurrence, updateActivity } from "@/lib/api";
import { useRoutineStore } from "@/store/routine-store";
import type { ActivityPayload } from "@/types/activity";

export function useActivities(weekStart: string) {
  const query = useRoutineStore((state) => state.query);
  const category = useRoutineStore((state) => state.category);

  return useQuery({
    queryKey: ["activities", weekStart, query, category],
    queryFn: () => listWeek(weekStart, query, category),
  });
}

export function useActivityMutations() {
  const queryClient = useQueryClient();
  const closeModal = useRoutineStore((state) => state.closeModal);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["activities"] });

  const create = useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      toast.success("Atividade criada");
      closeModal();
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActivityPayload }) => updateActivity(id, payload),
    onSuccess: () => {
      toast.success("Atividade atualizada");
      closeModal();
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      toast.success("Atividade excluída");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const removeAll = useMutation({
    mutationFn: deleteAllActivities,
    onSuccess: () => {
      toast.success("Rotina resetada");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const complete = useMutation({
    mutationFn: ({ id, date, completed }: { id: number; date: string; completed: boolean }) => completeOccurrence(id, date, completed),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const move = useMutation({
    mutationFn: ({ id, date, weekday, fromWeekday, startTime }: { id: number; date: string; weekday: number; fromWeekday: number; startTime: string }) =>
      moveOccurrence(id, date, weekday, fromWeekday, startTime),
    onSuccess: () => {
      toast.success("Atividade movida");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  return { create, update, remove, removeAll, complete, move };
}
