import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { BookOpenCheck, CheckCircle2, GraduationCap, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useStudyMutations, useStudyTopics } from "@/hooks/use-study";
import { cn } from "@/lib/utils";
import type { StudyTopic } from "@/types/study";

const topicSchema = z.object({
  title: z.string().min(2, "Informe o tema da trilha"),
  description: z.string().optional(),
});

const subtopicSchema = z.object({
  title: z.string().min(2, "Informe o assunto"),
  description: z.string().optional(),
});

type TopicValues = z.infer<typeof topicSchema>;
type SubtopicValues = z.infer<typeof subtopicSchema>;

export function StudyBoard() {
  const { data = [], isLoading } = useStudyTopics();
  const { createTopic } = useStudyMutations();
  const [createOpen, setCreateOpen] = useState(false);
  const totalSubtopics = data.reduce((total, topic) => total + topic.totalSubtopics, 0);
  const completedSubtopics = data.reduce((total, topic) => total + topic.completedCount, 0);
  const globalProgress = totalSubtopics ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;

  const form = useForm<TopicValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: { title: "", description: "" },
  });

  function submitTopic(values: TopicValues) {
    createTopic.mutate(values, {
      onSuccess: () => {
        form.reset();
        setCreateOpen(false);
      },
    });
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-3 rounded-2xl border bg-card p-3 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background text-violet-500">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight sm:text-lg">Organize temas e assuntos</h2>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Crie uma trilha como “IA” e marque cada assunto concluído.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 lg:w-[420px]">
          <StudyMetric label="Trilhas" value={data.length.toString()} loading={isLoading} />
          <StudyMetric label="Assuntos" value={totalSubtopics.toString()} loading={isLoading} />
          <StudyMetric label="Progresso" value={`${globalProgress}%`} loading={isLoading} />
        </div>

        <Button className="h-11 gap-2 shadow-sm sm:h-10" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Nova trilha
        </Button>
      </div>

      {isLoading ? (
        <StudySkeleton />
      ) : data.length === 0 ? (
        <Card className="border-dashed bg-card/60">
          <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
            <BookOpenCheck className="h-10 w-10 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">Nenhuma trilha criada ainda</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">Comece criando uma trilha como IA, Backend, Inglês ou Matemática e adicione os assuntos para acompanhar seu progresso.</p>
            </div>
            <Button className="h-11 sm:h-10" onClick={() => setCreateOpen(true)}>Criar primeira trilha</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {data.map((topic) => <StudyTopicCard key={topic.id} topic={topic} />)}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova trilha de estudo</DialogTitle>
            <DialogDescription>Crie um tema principal. Depois adicione os assuntos dentro dele.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={form.handleSubmit(submitTopic)}>
            <Field label="Tema" error={form.formState.errors.title?.message}>
              <Input placeholder="Ex: IA" {...form.register("title")} />
            </Field>
            <Field label="Descrição opcional">
              <Textarea placeholder="Objetivo, contexto ou observações da trilha" {...form.register("description")} />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createTopic.isPending}>{createTopic.isPending ? "Criando..." : "Criar trilha"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function StudyTopicCard({ topic }: { topic: StudyTopic }) {
  const { createSubtopic, completeSubtopic, removeTopic, removeSubtopic } = useStudyMutations();
  const [confirmTopicOpen, setConfirmTopicOpen] = useState(false);
  const form = useForm<SubtopicValues>({
    resolver: zodResolver(subtopicSchema),
    defaultValues: { title: "", description: "" },
  });

  function submitSubtopic(values: SubtopicValues) {
    createSubtopic.mutate(
      { topicId: topic.id, payload: values },
      {
        onSuccess: () => form.reset(),
      },
    );
  }

  return (
    <Card className="overflow-hidden bg-card shadow-sm">
      <CardContent className="space-y-3 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-xl font-semibold tracking-tight">{topic.title}</h3>
              <Badge variant={topic.progressPercent === 100 ? "default" : "secondary"}>{topic.progressPercent}%</Badge>
            </div>
            {topic.description ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{topic.description}</p> : null}
          </div>
          <Button size="icon" variant="ghost" className="h-10 w-10 shrink-0" onClick={() => setConfirmTopicOpen(true)} aria-label="Excluir trilha">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{topic.completedCount}/{topic.totalSubtopics} assuntos concluídos</span>
            <span>{topic.progressPercent}% estudado</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400" initial={{ width: 0 }} animate={{ width: `${topic.progressPercent}%` }} />
          </div>
        </div>

        <div className="scrollbar-soft max-h-64 space-y-2 overflow-y-auto pr-1">
          {topic.subtopics.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">Adicione assuntos como “Harness”, “RAG”, “Agentes” ou qualquer etapa da sua trilha.</div>
          ) : (
            topic.subtopics.map((subtopic) => (
              <div key={subtopic.id} className={cn("group rounded-2xl border bg-background/70 p-3 transition hover:bg-background", subtopic.completed && "opacity-70")}>
                <div className="flex items-start gap-3">
                  <button
                    className={cn("-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition", subtopic.completed ? "text-emerald-500" : "text-muted-foreground hover:text-foreground")}
                    onClick={() => completeSubtopic.mutate({ id: subtopic.id, completed: !subtopic.completed })}
                    aria-label="Alternar conclusão"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn("font-medium leading-tight", subtopic.completed && "line-through")}>{subtopic.title}</p>
                    {subtopic.description ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{subtopic.description}</p> : null}
                  </div>
                  <Button size="icon" variant="ghost" className="h-9 w-9 opacity-100 md:h-7 md:w-7 md:opacity-0 md:group-hover:opacity-100" onClick={() => removeSubtopic.mutate(subtopic.id)} aria-label="Excluir assunto">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <form className="grid gap-2 rounded-xl border bg-background/50 p-2.5" onSubmit={form.handleSubmit(submitSubtopic)}>
          <Input placeholder="Novo assunto. Ex: Harness" {...form.register("title")} />
          <Textarea className="min-h-16" placeholder="Descrição opcional" {...form.register("description")} />
          {form.formState.errors.title?.message ? <span className="text-xs text-destructive">{form.formState.errors.title.message}</span> : null}
          <Button type="submit" disabled={createSubtopic.isPending} className="gap-2">
            <Plus className="h-4 w-4" /> {createSubtopic.isPending ? "Adicionando..." : "Adicionar assunto"}
          </Button>
        </form>
      </CardContent>

      <AlertDialog open={confirmTopicOpen} onOpenChange={setConfirmTopicOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir trilha?</AlertDialogTitle>
            <AlertDialogDescription>Todos os assuntos dentro de “{topic.title}” serão removidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => removeTopic.mutate(topic.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function StudyMetric({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="rounded-xl border bg-background/65 p-2.5">
      <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      {loading ? <Skeleton className="mt-2 h-6 w-12" /> : <p className="mt-1.5 text-xl font-semibold tracking-tight">{value}</p>}
    </div>
  );
}

function StudySkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="bg-card/65">
          <CardContent className="space-y-4 p-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
