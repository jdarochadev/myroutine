import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getMonday, toISODate } from "@/lib/date";
import type { ActivityOccurrence } from "@/types/activity";

type Theme = "dark" | "light";
type AppView = "routine" | "study";

type ModalState = {
  open: boolean;
  occurrence?: ActivityOccurrence;
  date?: string;
};

type RoutineState = {
  currentWeekStart: string;
  query: string;
  category: string;
  theme: Theme;
  appView: AppView;
  modal: ModalState;
  setCurrentWeekStart: (date: string) => void;
  setQuery: (query: string) => void;
  setCategory: (category: string) => void;
  setAppView: (view: AppView) => void;
  toggleTheme: () => void;
  openCreateModal: (date?: string) => void;
  openEditModal: (occurrence: ActivityOccurrence) => void;
  closeModal: () => void;
};

export const useRoutineStore = create<RoutineState>()(
  persist(
    (set, get) => ({
      currentWeekStart: toISODate(getMonday()),
      query: "",
      category: "all",
      theme: "dark",
      appView: "routine",
      modal: { open: false },
      setCurrentWeekStart: (date) => set({ currentWeekStart: date }),
      setQuery: (query) => set({ query }),
      setCategory: (category) => set({ category }),
      setAppView: (appView) => set({ appView }),
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        document.documentElement.classList.toggle("dark", next === "dark");
        set({ theme: next });
      },
      openCreateModal: (date) => set({ modal: { open: true, date } }),
      openEditModal: (occurrence) => set({ modal: { open: true, occurrence, date: occurrence.occurrenceDate } }),
      closeModal: () => set({ modal: { open: false } }),
    }),
    {
      name: "myroutine:settings",
      partialize: (state) => ({
        currentWeekStart: state.currentWeekStart,
        query: state.query,
        category: state.category,
        theme: state.theme,
        appView: state.appView,
      }),
      onRehydrateStorage: () => (state) => {
        document.documentElement.classList.toggle("dark", state?.theme !== "light");
      },
    },
  ),
);
