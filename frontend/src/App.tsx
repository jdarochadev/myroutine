import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, BookOpenCheck, CalendarDays, Moon, Plus, Search, Sparkles, Sun, Trash2 } from "lucide-react";
import { useState } from "react";
import { ActivityModal } from "@/components/activity/activity-modal";
import { StudyBoard } from "@/components/study/study-board";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { WeeklyCalendar } from "@/components/calendar/weekly-calendar";
import { useActivities, useActivityMutations } from "@/hooks/use-activities";
import { useCurrentWeek } from "@/hooks/use-current-week";
import { cn } from "@/lib/utils";
import { useRoutineStore } from "@/store/routine-store";

export function App() {
  const [resetOpen, setResetOpen] = useState(false);
  const { weekStart, weekLabel, goToPreviousWeek, goToNextWeek, goToCurrentWeek } = useCurrentWeek();
  const { data, isLoading, isFetching } = useActivities(weekStart);
  const { removeAll } = useActivityMutations();
  const query = useRoutineStore((state) => state.query);
  const setQuery = useRoutineStore((state) => state.setQuery);
  const category = useRoutineStore((state) => state.category);
  const setCategory = useRoutineStore((state) => state.setCategory);
  const theme = useRoutineStore((state) => state.theme);
  const toggleTheme = useRoutineStore((state) => state.toggleTheme);
  const appView = useRoutineStore((state) => state.appView);
  const setAppView = useRoutineStore((state) => state.setAppView);
  const modal = useRoutineStore((state) => state.modal);
  const openCreateModal = useRoutineStore((state) => state.openCreateModal);

  const activities = data?.occurrences ?? [];
  const categories = data?.categories ?? [];
  const completionRate = data?.stats.completionRate ?? 0;
  const totalMinutes = data?.stats.totalMinutes ?? 0;

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_12%_-4%,oklch(0.78_0.13_70/0.28),transparent_30rem),radial-gradient(circle_at_86%_2%,oklch(0.73_0.08_145/0.16),transparent_26rem),linear-gradient(180deg,oklch(0.985_0.012_78),oklch(0.955_0.018_74))] dark:bg-[radial-gradient(circle_at_12%_-4%,oklch(0.66_0.13_70/0.16),transparent_30rem),radial-gradient(circle_at_86%_2%,oklch(0.65_0.08_145/0.12),transparent_26rem),linear-gradient(180deg,oklch(0.18_0.026_62),oklch(0.16_0.028_62))]" />
      <section className="flex min-h-screen flex-col pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <header className="sticky top-0 z-30 border-b bg-background/92 shadow-[0_18px_55px_-45px_oklch(0.25_0.04_64/0.7)] backdrop-blur-md">
          <div className="container flex flex-col gap-3 px-3 py-3.5 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> MyRoutine
                </div>
                <h1 className="mt-0.5 truncate text-2xl font-black tracking-[-0.045em] sm:text-3xl">
                  {appView === "routine" ? "Rotina semanal" : "Trilhas de estudo"}
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2 lg:hidden">
                <ThemeSwitch theme={theme} toggleTheme={toggleTheme} />
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="grid grid-cols-2 gap-1 rounded-2xl border bg-card p-1 shadow-soft">
                <Button variant={appView === "routine" ? "default" : "ghost"} size="sm" className="h-11 gap-2 sm:h-9" onClick={() => setAppView("routine")}>
                  <CalendarDays className="h-4 w-4" /> Rotina
                </Button>
                <Button variant={appView === "study" ? "default" : "ghost"} size="sm" className="h-11 gap-2 sm:h-9" onClick={() => setAppView("study")}>
                  <BookOpenCheck className="h-4 w-4" /> Estudos
                </Button>
              </div>
              <div className="hidden lg:block">
                <ThemeSwitch theme={theme} toggleTheme={toggleTheme} />
              </div>
            </div>
          </div>
        </header>

        <div className="container flex flex-1 flex-col gap-4 px-3 pt-4 sm:px-5 lg:gap-5 lg:pt-6">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="max-w-2xl text-base font-medium leading-7 text-foreground/75">
                {appView === "routine"
                  ? "Planeje a semana, ajuste atividades por dia e acompanhe o que já saiu do papel."
                  : "Quebre temas grandes em assuntos pequenos e avance com percentual claro por trilha."}
              </p>
            </div>
            {appView === "routine" ? (
              <div className="grid grid-cols-3 gap-2 lg:w-[540px]">
                <Metric icon={CalendarDays} label="Atividades" value={activities.length.toString()} loading={isLoading} />
                <Metric icon={BarChart3} label="Produtividade" value={`${completionRate}%`} loading={isLoading} />
                <Metric icon={Sparkles} label="Planejado" value={`${Math.round(totalMinutes / 60)}h`} loading={isLoading} />
              </div>
            ) : null}
          </div>

          {appView === "routine" ? <div className="rounded-[1.7rem] border bg-card p-3 shadow-soft">
            <div className="grid gap-3 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center">
              <div className="grid grid-cols-3 items-center gap-1 rounded-2xl border bg-background p-1 sm:flex sm:gap-1">
                <Button variant="ghost" size="sm" className="h-10 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm" onClick={goToPreviousWeek}>Anterior</Button>
                <Button variant="secondary" size="sm" className="h-10 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm" onClick={goToCurrentWeek}>{weekLabel}</Button>
                <Button variant="ghost" size="sm" className="h-10 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm" onClick={goToNextWeek}>Próxima</Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem] xl:max-w-xl">
                <div className="relative min-w-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar atividade" className="pl-9" />
                </div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                <Button variant="outline" onClick={() => setResetOpen(true)} className="h-11 gap-2 text-destructive hover:text-destructive sm:h-10">
                  <Trash2 className="h-4 w-4" /> Resetar
                </Button>
                <Button onClick={() => openCreateModal()} className="h-11 gap-2 shadow-glow sm:h-10">
                  <Plus className="h-4 w-4" /> Nova atividade
                </Button>
              </div>
            </div>
            {isFetching && !isLoading ? <p className="mt-2 text-xs text-muted-foreground">Sincronizando alterações...</p> : null}
          </div> : null}

          <AnimatePresence mode="wait">
            <motion.div
              key={appView === "routine" ? weekStart : "study"}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {appView === "routine" ? (isLoading ? <CalendarSkeleton /> : <WeeklyCalendar weekStart={weekStart} data={data} />) : <StudyBoard />}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
      <ActivityModal open={modal.open} />
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar rotina semanal?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso apagará todas as atividades fixas e não fixas da rotina. Suas trilhas de estudo não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                removeAll.mutate(undefined, { onSuccess: () => setResetOpen(false) });
              }}
            >
              {removeAll.isPending ? "Resetando..." : "Apagar tudo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function Metric({ icon: Icon, label, value, loading }: { icon: typeof Sparkles; label: string; value: string; loading: boolean }) {
  return (
    <div className="rounded-2xl border bg-background/65 p-2.5 sm:rounded-3xl sm:p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="truncate text-[10px] font-medium uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.2em]">{label}</span>
        <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
      </div>
      {loading ? <Skeleton className="mt-3 h-7 w-14 sm:mt-4 sm:h-8 sm:w-20" /> : <p className="mt-2 text-2xl font-black tracking-[-0.045em] sm:mt-3 sm:text-3xl">{value}</p>}
    </div>
  );
}

function ThemeSwitch({ theme, toggleTheme }: { theme: "dark" | "light"; toggleTheme: () => void }) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-xl border bg-card px-3 shadow-sm lg:h-10">
      {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} aria-label="Alternar tema" />
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
      {Array.from({ length: 7 }).map((_, index) => (
        <Card key={index} className="h-[330px] min-w-0 bg-card/65 sm:h-[360px] lg:h-[520px] xl:h-[560px]">
          <CardContent className="space-y-3 p-2.5 xl:p-3">
            <Skeleton className="h-7 w-24" />
            <Separator />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className={cn("h-12 w-full rounded-xl", index % 2 && "hidden xl:block")} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
