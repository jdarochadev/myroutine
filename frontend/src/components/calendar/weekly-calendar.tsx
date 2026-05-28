import { AnimatePresence, motion } from "framer-motion";
import { Calendar, CheckCircle2, Clock, Edit3, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useActivityMutations } from "@/hooks/use-activities";
import { getWeekDays } from "@/lib/date";
import { cn, minutesToLabel } from "@/lib/utils";
import { useRoutineStore } from "@/store/routine-store";
import type { ActivityOccurrence, WeekResponse } from "@/types/activity";

type DragPayload = {
  id: number;
  occurrenceDate: string;
  startTime: string;
  weekday: number;
};

export function WeeklyCalendar({ weekStart, data }: { weekStart: string; data?: WeekResponse }) {
  const days = getWeekDays(weekStart);
  const occurrences = data?.occurrences ?? [];
  const openCreateModal = useRoutineStore((state) => state.openCreateModal);
  const { move } = useActivityMutations();
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [selectedOccurrence, setSelectedOccurrence] = useState<ActivityOccurrence | null>(null);

  function handleDrop(date: string, weekday: number, event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(null);
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return;
    const payload = JSON.parse(raw) as DragPayload;
    if (payload.occurrenceDate === date) return;
    move.mutate({ id: payload.id, date, weekday, fromWeekday: payload.weekday, startTime: payload.startTime });
  }

  return (
    <>
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
      {days.map((day) => {
        const dayItems = occurrences.filter((item) => item.occurrenceDate === day.iso);
        const completed = dayItems.filter((item) => item.completed).length;
        const progress = dayItems.length ? Math.round((completed / dayItems.length) * 100) : 0;

        return (
          <Card
            key={day.iso}
            className={cn("h-[330px] min-w-0 bg-card/70 transition-all sm:h-[360px] lg:h-[520px] xl:h-[560px]", day.isToday && "ring-2 ring-sky-400/70 shadow-glow", dragOver === day.iso && "scale-[1.01] border-sky-400 bg-sky-400/10")}
          >
            <CardContent
              className="flex h-full flex-col gap-2.5 p-2.5 xl:gap-3 xl:p-3"
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(day.iso);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(event) => handleDrop(day.iso, day.weekday, event)}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground xl:text-xs xl:tracking-[0.18em]">{day.label}</p>
                    {day.isToday ? <Badge className="bg-sky-500 px-2 py-0 text-[10px] text-white">Hoje</Badge> : null}
                  </div>
                  <div className="mt-0.5 flex items-end gap-1.5">
                    <span className="text-2xl font-semibold tracking-tight xl:text-3xl">{day.dayNumber}</span>
                    <span className="pb-1 text-xs text-muted-foreground capitalize">{day.month}</span>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-xl xl:h-8 xl:w-8" onClick={() => openCreateModal(day.iso)} aria-label="Criar atividade neste dia">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{completed}/{dayItems.length} concluídas</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="scrollbar-soft flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {dayItems.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-24 flex-1 items-center justify-center rounded-2xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                      Arraste ou crie uma atividade.
                    </motion.div>
                  ) : (
                    dayItems.map((occurrence) => (
                      <ActivityCard key={`${occurrence.activity.id}-${occurrence.occurrenceDate}`} occurrence={occurrence} onOpenDetails={setSelectedOccurrence} />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
    <ActivityDetailModal occurrence={selectedOccurrence} onOpenChange={(open) => !open && setSelectedOccurrence(null)} />
    </>
  );
}

function ActivityCard({ occurrence, onOpenDetails }: { occurrence: ActivityOccurrence; onOpenDetails: (occurrence: ActivityOccurrence) => void }) {
  const { activity } = occurrence;
  const openEditModal = useRoutineStore((state) => state.openEditModal);
  const { complete, remove } = useActivityMutations();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <motion.article
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        draggable
        onDragStartCapture={(event) => {
          const payload: DragPayload = {
            id: activity.id,
            occurrenceDate: occurrence.occurrenceDate,
            startTime: activity.startTime,
            weekday: occurrence.weekday,
          };
          event.dataTransfer.setData("application/json", JSON.stringify(payload));
        }}
        onClick={() => onOpenDetails(occurrence)}
        className={cn("group relative cursor-pointer rounded-xl border bg-background/85 p-2 shadow-sm transition active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-md", occurrence.completed && "opacity-65")}
        style={{ borderLeftColor: activity.color || "#38bdf8", borderLeftWidth: 4 }}
      >
        <div className="pr-7">
          <div className="flex min-w-0 items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 font-semibold">{activity.startTime}</span>
            <Clock className="h-3 w-3 shrink-0" />
            <span className="shrink-0">{minutesToLabel(activity.durationMinutes)}</span>
          </div>
          <h3 className={cn("mt-1 line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground", occurrence.completed && "line-through")}>{activity.title}</h3>
          <div className="mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden text-[10px] text-muted-foreground">
            <span className="shrink-0">{activity.type === "fixed" ? "Fixa" : "Única"}</span>
            {activity.category ? <span className="truncate">• {activity.category}</span> : null}
          </div>
        </div>
        <button
          className={cn("absolute right-2 top-2 rounded-full p-1 transition hover:bg-accent", occurrence.completed && "text-emerald-500")}
          onClick={(event) => {
            event.stopPropagation();
            complete.mutate({ id: activity.id, date: occurrence.occurrenceDate, completed: !occurrence.completed });
          }}
          aria-label="Marcar como concluída"
        >
          <CheckCircle2 className="h-4 w-4" />
        </button>
        <div className="absolute bottom-1.5 right-1.5 flex gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100">
          <Button size="icon" variant="ghost" className="h-6 w-6 rounded-lg" onClick={(event) => { event.stopPropagation(); openEditModal(occurrence); }} aria-label="Editar atividade">
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6 rounded-lg" onClick={(event) => { event.stopPropagation(); setConfirmOpen(true); }} aria-label="Excluir atividade">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.article>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir atividade?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação remove a atividade e suas recorrências. Não é possível desfazer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => remove.mutate(activity.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ActivityDetailModal({ occurrence, onOpenChange }: { occurrence: ActivityOccurrence | null; onOpenChange: (open: boolean) => void }) {
  const openEditModal = useRoutineStore((state) => state.openEditModal);
  const { complete } = useActivityMutations();
  if (!occurrence) return null;

  const { activity } = occurrence;

  return (
    <Dialog open={Boolean(occurrence)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[1.5rem] p-5 sm:p-6">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{occurrence.occurrenceDate}</span>
            <span>•</span>
            <span>{activity.startTime}</span>
            <span>•</span>
            <span>{minutesToLabel(activity.durationMinutes)}</span>
          </div>
          <DialogTitle className="text-2xl leading-tight">{activity.title}</DialogTitle>
          <DialogDescription>Detalhes da atividade selecionada.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-background/70 p-4">
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">{activity.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={activity.type === "fixed" ? "default" : "secondary"}>{activity.type === "fixed" ? "Atividade fixa" : "Atividade única"}</Badge>
            {activity.category ? <Badge variant="outline">{activity.category}</Badge> : null}
            <Badge variant={activity.priority === "high" ? "destructive" : "outline"}>Prioridade {priorityLabel(activity.priority).toLowerCase()}</Badge>
            {occurrence.completed ? <Badge className="bg-emerald-500 text-white">Concluída</Badge> : null}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant={occurrence.completed ? "outline" : "secondary"}
            onClick={() => complete.mutate({ id: activity.id, date: occurrence.occurrenceDate, completed: !occurrence.completed })}
          >
            {occurrence.completed ? "Desmarcar" : "Concluir"}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              openEditModal(occurrence);
            }}
          >
            Editar atividade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function priorityLabel(priority: string) {
  if (priority === "high") return "Alta";
  if (priority === "low") return "Baixa";
  return "Média";
}
