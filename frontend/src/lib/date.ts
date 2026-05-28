import { addDays, format, isSameDay, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

export function toISODate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function getMonday(date = new Date()) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekDays(weekStart: string) {
  const start = parseISO(weekStart);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    return {
      date,
      iso: toISODate(date),
      label: format(date, "EEE", { locale: ptBR }).replace(".", ""),
      dayNumber: format(date, "dd"),
      month: format(date, "MMM", { locale: ptBR }).replace(".", ""),
      weekday: index + 1,
      isToday: isSameDay(date, new Date()),
    };
  });
}

export function weekRangeLabel(weekStart: string) {
  const start = parseISO(weekStart);
  const end = addDays(start, 6);
  return `${format(start, "dd MMM", { locale: ptBR })} - ${format(end, "dd MMM", { locale: ptBR })}`;
}
