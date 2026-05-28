import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActivityMutations } from "@/hooks/use-activities";
import { getWeekDays } from "@/lib/date";
import { cn } from "@/lib/utils";
import { useRoutineStore } from "@/store/routine-store";
import type { ActivityPayload, Priority } from "@/types/activity";

const formSchema = z
  .object({
    title: z.string().min(2, "Informe um título"),
    description: z.string().min(2, "Informe uma descrição"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
    durationMinutes: z.coerce.number().min(5, "Mínimo de 5 minutos").max(1440, "Máximo de 24 horas"),
    type: z.enum(["fixed", "single"]),
    date: z.string().optional(),
    weekdays: z.array(z.number()).default([]),
    color: z.string().optional(),
    category: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]),
  })
  .superRefine((value, ctx) => {
    if (value.type === "fixed" && value.weekdays.length === 0) {
      ctx.addIssue({ path: ["weekdays"], code: "custom", message: "Selecione ao menos um dia" });
    }
    if (value.type === "single" && !value.date) {
      ctx.addIssue({ path: ["date"], code: "custom", message: "Selecione uma data" });
    }
  });

type FormValues = z.infer<typeof formSchema>;

const colors = ["#38bdf8", "#818cf8", "#a78bfa", "#f472b6", "#fb7185", "#f59e0b", "#34d399"];

export function ActivityModal({ open }: { open: boolean }) {
  const modal = useRoutineStore((state) => state.modal);
  const closeModal = useRoutineStore((state) => state.closeModal);
  const weekStart = useRoutineStore((state) => state.currentWeekStart);
  const { create, update } = useActivityMutations();
  const occurrence = modal.occurrence;
  const activity = occurrence?.activity;
  const days = getWeekDays(weekStart);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      title: activity?.title ?? "",
      description: activity?.description ?? "",
      startTime: activity?.startTime ?? "08:00",
      durationMinutes: activity?.durationMinutes ?? 60,
      type: activity?.type ?? "single",
      date: activity?.date ?? modal.date ?? days[0]?.iso,
      weekdays: activity?.weekdays?.length ? activity.weekdays : modal.date ? [days.find((day) => day.iso === modal.date)?.weekday ?? 1] : [1],
      color: activity?.color ?? colors[0],
      category: activity?.category ?? "",
      priority: activity?.priority ?? "medium",
    },
  });

  const type = form.watch("type");
  const selectedColor = form.watch("color");
  const selectedWeekdays = form.watch("weekdays");
  const isPending = create.isPending || update.isPending;

  function onSubmit(values: FormValues) {
    const payload: ActivityPayload = {
      ...values,
      category: values.category?.trim() || undefined,
      color: values.color || colors[0],
      weekdays: values.type === "fixed" ? [...values.weekdays].sort((a, b) => a - b) : [],
      date: values.type === "single" ? values.date : undefined,
      priority: values.priority as Priority,
    };

    if (activity) update.mutate({ id: activity.id, payload });
    else create.mutate(payload);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeModal()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{activity ? "Editar atividade" : "Nova atividade"}</DialogTitle>
          <DialogDescription>Defina horário, duração e recorrência. A agenda ordena tudo automaticamente.</DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Título" error={form.formState.errors.title?.message}>
              <Input placeholder="Ex: Treino funcional" {...form.register("title")} />
            </Field>
            <Field label="Categoria">
              <Input placeholder="Saúde, trabalho, estudo" {...form.register("category")} />
            </Field>
          </div>

          <Field label="Descrição" error={form.formState.errors.description?.message}>
            <Textarea placeholder="Notas rápidas sobre a atividade" {...form.register("description")} />
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Início" error={form.formState.errors.startTime?.message}>
              <Input type="time" {...form.register("startTime")} />
            </Field>
            <Field label="Duração (min)" error={form.formState.errors.durationMinutes?.message}>
              <Input type="number" min={5} max={1440} {...form.register("durationMinutes")} />
            </Field>
            <Field label="Prioridade">
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <Field label="Tipo da atividade">
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2 rounded-2xl border bg-background/60 p-1">
                  {[
                    ["single", "Não fixa"],
                    ["fixed", "Fixa"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => field.onChange(value)}
                      className={cn("rounded-xl px-4 py-2 text-sm font-medium transition", field.value === value ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-accent")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            />
          </Field>

          {type === "fixed" ? (
            <Field label="Dias da semana" error={form.formState.errors.weekdays?.message}>
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => (
                  <button
                    key={day.weekday}
                    type="button"
                    onClick={() => {
                      const next = selectedWeekdays.includes(day.weekday)
                        ? selectedWeekdays.filter((item) => item !== day.weekday)
                        : [...selectedWeekdays, day.weekday];
                      form.setValue("weekdays", next, { shouldValidate: true });
                    }}
                    className={cn("rounded-xl border px-2 py-3 text-xs font-semibold uppercase transition", selectedWeekdays.includes(day.weekday) ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent")}
                  >
                    {day.label.slice(0, 3)}
                  </button>
                ))}
              </div>
            </Field>
          ) : (
            <Field label="Data" error={form.formState.errors.date?.message}>
              <Input type="date" {...form.register("date")} />
            </Field>
          )}

          <Field label="Cor personalizada">
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => form.setValue("color", color)}
                  className={cn("h-9 w-9 rounded-full border-2 transition", selectedColor === color ? "border-foreground scale-105" : "border-transparent")}
                  style={{ backgroundColor: color }}
                  aria-label={`Selecionar cor ${color}`}
                />
              ))}
              <Input type="color" className="h-9 w-14 p-1" {...form.register("color")} />
            </div>
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar atividade"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
