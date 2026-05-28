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
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_32rem),radial-gradient(circle_at_top_right,rgba(14,165,233,0.15),transparent_28rem)]" />
      <section className="container flex min-h-screen flex-col gap-4 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:py-5 lg:gap-6 lg:py-8">
        <header className="flex flex-col gap-4 rounded-[1.5rem] border bg-card/75 p-4 shadow-soft backdrop-blur-xl sm:rounded-[2rem] sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
              {appView === "routine" ? "Rotina semanal inteligente" : "Trilhas de estudo"}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-5xl">RoutineApp</h1>
              <p className="mt-1 max-w-2xl text-xs text-muted-foreground sm:mt-2 sm:text-sm md:text-base">
                {appView === "routine"
                  ? "Organização prática e faćil."
                  : "Estruture temas, acompanhe subtemas e veja o progresso real das suas trilhas de aprendizado."}
              </p>
            </div>
            <div className="grid max-w-sm grid-cols-2 gap-1 rounded-2xl border bg-background/70 p-1">
              <Button variant={appView === "routine" ? "secondary" : "ghost"} size="sm" className="gap-2" onClick={() => setAppView("routine")}>
                <CalendarDays className="h-4 w-4" /> Rotina
              </Button>
              <Button variant={appView === "study" ? "secondary" : "ghost"} size="sm" className="gap-2" onClick={() => setAppView("study")}>
                <BookOpenCheck className="h-4 w-4" /> Estudos
              </Button>
            </div>
          </div>

          <div className={cn("grid grid-cols-3 gap-2 sm:gap-3 lg:min-w-[520px]", appView === "study" && "hidden lg:grid")}>
            <Metric icon={CalendarDays} label="Atividades" value={activities.length.toString()} loading={isLoading} />
            <Metric icon={BarChart3} label="Produtividade" value={`${completionRate}%`} loading={isLoading} />
            <Metric icon={Sparkles} label="Planejado" value={`${Math.round(totalMinutes / 60)}h`} loading={isLoading} />
          </div>
        </header>

        {appView === "routine" ? <Card className="border bg-card/70 shadow-soft backdrop-blur-xl">
          <CardContent className="flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="grid grid-cols-3 items-center gap-1 rounded-2xl border bg-background/70 p-1 sm:flex sm:gap-2">
                <Button variant="ghost" size="sm" className="px-2 text-xs sm:px-3 sm:text-sm" onClick={goToPreviousWeek}>Anterior</Button>
                <Button variant="secondary" size="sm" className="px-2 text-xs sm:px-3 sm:text-sm" onClick={goToCurrentWeek}>{weekLabel}</Button>
                <Button variant="ghost" size="sm" className="px-2 text-xs sm:px-3 sm:text-sm" onClick={goToNextWeek}>Próxima</Button>
              </div>
              {isFetching && !isLoading ? <span className="text-xs text-muted-foreground">Sincronizando...</span> : null}
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_12rem_auto_auto] lg:flex lg:items-center lg:gap-3">
              <div className="relative min-w-0 lg:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar atividade" className="pl-9" />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="lg:w-44">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between gap-3 rounded-2xl border bg-background/70 px-3 py-2">
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} aria-label="Alternar tema" />
              </div>
              <Button variant="outline" onClick={() => setResetOpen(true)} className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" /> Resetar
              </Button>
              <Button onClick={() => openCreateModal()} className="gap-2 shadow-glow">
                <Plus className="h-4 w-4" /> Nova atividade
              </Button>
            </div>
          </CardContent>
        </Card> : null}

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
      {loading ? <Skeleton className="mt-3 h-7 w-14 sm:mt-4 sm:h-8 sm:w-20" /> : <p className="mt-2 text-xl font-semibold tracking-tight sm:mt-3 sm:text-2xl">{value}</p>}
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
