import { addWeeks } from "date-fns";
import { getMonday, toISODate, weekRangeLabel } from "@/lib/date";
import { useRoutineStore } from "@/store/routine-store";

export function useCurrentWeek() {
  const weekStart = useRoutineStore((state) => state.currentWeekStart);
  const setCurrentWeekStart = useRoutineStore((state) => state.setCurrentWeekStart);

  return {
    weekStart,
    weekLabel: weekRangeLabel(weekStart),
    goToPreviousWeek: () => setCurrentWeekStart(toISODate(addWeeks(new Date(`${weekStart}T00:00:00`), -1))),
    goToNextWeek: () => setCurrentWeekStart(toISODate(addWeeks(new Date(`${weekStart}T00:00:00`), 1))),
    goToCurrentWeek: () => setCurrentWeekStart(toISODate(getMonday())),
  };
}
