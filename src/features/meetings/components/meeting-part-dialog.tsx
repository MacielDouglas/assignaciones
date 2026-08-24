"use client";

import { Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/features/meetings/components/field";
import { PeoplePicker } from "@/features/meetings/components/people-picker";
import type { CandidatePerson } from "@/features/meetings/lib/candidates";
import type { MeetingPart } from "@/features/meetings/lib/meeting-builder";
import { apiFetch, getErrorMessage } from "@/lib/api-client";

/**
 * Edição rápida de uma parte da programação (owner/admin).
 *
 * Tarefa comum (designar pessoas) fica sempre visível; ajustes estruturais
 * da parte (título, subtítulo, horário, duração, cântico) ficam atrás de um
 * disclosure avançado, com prévia do antes → depois antes de salvar.
 * Persistência no servidor (`/meetings/program-part`), que grava overrides
 * no JSON da apostila e mescla as designações na programação salva.
 */
export function MeetingPartDialog({
  organizationId,
  weekStartIso,
  meetingType,
  part,
  sectionTitle,
  roster,
  assignedPersonIds,
}: {
  organizationId: string;
  weekStartIso: string;
  meetingType: "MIDWEEK" | "WEEKEND";
  part: MeetingPart;
  /** Nome da seção para dar contexto ao diálogo. */
  sectionTitle: string;
  roster: CandidatePerson[];
  assignedPersonIds: Record<string, string>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(part.title);
  const [subtitle, setSubtitle] = useState(part.subtitle ?? "");
  const [startTime, setStartTime] = useState(part.time ?? "");
  const [duration, setDuration] = useState(String(part.duration));
  const [songNumber, setSongNumber] = useState(
    part.song?.number && part.song.number > 0 ? String(part.song.number) : "",
  );
  const [slotPersons, setSlotPersons] = useState<Record<string, string>>(() =>
    Object.fromEntries(part.slots.map((slot) => [slot.id, assignedPersonIds[slot.id] ?? ""])),
  );
  const previousPersonsRef = useRef<Record<string, string>>({});

  function resetForm() {
    setTitle(part.title);
    setSubtitle(part.subtitle ?? "");
    setStartTime(part.time ?? "");
    setDuration(String(part.duration));
    setSongNumber(part.song?.number && part.song.number > 0 ? String(part.song.number) : "");
    setSlotPersons(
      Object.fromEntries(part.slots.map((slot) => [slot.id, assignedPersonIds[slot.id] ?? ""])),
    );
  }

  function openDialog() {
    resetForm();
    setOpen(true);
  }

  function currentOverrides() {
    return {
      ...(title.trim() && title.trim() !== part.title ? { title: title.trim() } : {}),
      ...(subtitle !== (part.subtitle ?? "") ? { subtitle } : {}),
      startTime: startTime === "" ? null : startTime,
      durationMinutes: Number(duration) || 0,
      songNumber: songNumber === "" ? null : Number(songNumber),
    };
  }

  const detailsDirty =
    title.trim() !== part.title ||
    subtitle !== (part.subtitle ?? "") ||
    startTime !== (part.time ?? "") ||
    Number(duration) !== part.duration ||
    (songNumber === "" ? null : Number(songNumber)) !==
      (part.song?.number && part.song.number > 0 ? part.song.number : null);

  const diffLines = [
    title.trim() !== part.title ? `Título: ${part.title} → ${title.trim()}` : null,
    subtitle !== (part.subtitle ?? "")
      ? `Subtítulo: ${part.subtitle ?? "—"} → ${subtitle || "—"}`
      : null,
    startTime !== (part.time ?? "") ? `Início: ${part.time ?? "—"} → ${startTime || "—"}` : null,
    Number(duration) !== part.duration
      ? `Duração: ${part.duration} → ${Number(duration)} min`
      : null,
    (songNumber === "" ? null : Number(songNumber)) !==
    (part.song?.number && part.song.number > 0 ? part.song.number : null)
      ? `Cântico: ${part.song?.number || "—"} → ${songNumber || "—"}`
      : null,
  ].filter(Boolean) as string[];

  async function savePart(
    overrides: Record<string, unknown>,
    slots: { slotId: string; label: string; kind: string; personId: string | null }[],
  ) {
    await apiFetch(`/api/organizations/${organizationId}/meetings/program-part`, {
      method: "POST",
      body: JSON.stringify({
        weekStart: weekStartIso,
        meetingType,
        partId: part.id,
        overrides,
        slots,
      }),
    });
  }

  async function handleSave() {
    setSaving(true);
    previousPersonsRef.current = Object.fromEntries(
      part.slots.map((slot) => [slot.id, assignedPersonIds[slot.id] ?? ""]),
    );
    try {
      const slotsPayload = part.slots.map((slot) => ({
        slotId: slot.id,
        label: slot.label,
        kind: slot.kind,
        personId: slotPersons[slot.id] || null,
      }));
      const overridesPayload = detailsDirty ? currentOverrides() : {};
      await savePart(overridesPayload, slotsPayload);
      setOpen(false);
      router.refresh();
      if (!detailsDirty) {
        // Janela generosa: o undo só é útil se o dedo distraído alcançá-lo.
        toast.success("Designações salvas!", {
          duration: 10000,
          action: {
            label: "Desfazer",
            onClick: () => {
              void (async () => {
                try {
                  await savePart(
                    {},
                    part.slots.map((slot) => ({
                      slotId: slot.id,
                      label: slot.label,
                      kind: slot.kind,
                      personId: previousPersonsRef.current[slot.id] || null,
                    })),
                  );
                  router.refresh();
                  toast.success("Designações revertidas.");
                } catch (error) {
                  toast.error(getErrorMessage(error));
                }
              })();
            },
          },
        });
      } else {
        toast.success("Parte atualizada!");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground size-11 rounded-full"
        onClick={openDialog}
        aria-label={`Editar ${part.title}`}
      >
        <Pencil className="size-4" aria-hidden="true" />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && !saving) setOpen(false);
        }}
      >
        <DialogContent className="flex max-h-dvh flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="text-base font-semibold tracking-tight">
              {part.title}
            </DialogTitle>
            <DialogDescription className="truncate text-sm">
              {sectionTitle}
              {part.time ? ` · ${part.time}` : ""} · {part.duration} min
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Designados
              </p>
              {part.slots.length > 0 ? (
                (() => {
                  // Aluno da regra ajudante×aluno, resolvido uma única vez.
                  const studentSlot = part.slots.find(
                    (candidate) => candidate.id === `${part.id}-student`,
                  );
                  return part.slots.map((slot) => (
                    <div key={slot.id} className="space-y-1">
                      <p className="text-muted-foreground text-xs">{slot.label}</p>
                      <PeoplePicker
                        kind={slot.kind}
                        label={slot.label}
                        roster={roster}
                        student={
                          studentSlot
                            ? (roster.find((person) => person.id === slotPersons[studentSlot.id]) ??
                              null)
                            : null
                        }
                        value={slotPersons[slot.id] ?? ""}
                        weekStartIso={weekStartIso}
                        onSelect={(personId) =>
                          setSlotPersons((current) => ({ ...current, [slot.id]: personId }))
                        }
                      />
                    </div>
                  ));
                })()
              ) : (
                <p className="text-muted-foreground text-sm">
                  Esta parte não tem designação individual.
                </p>
              )}
            </div>

            <details className="group rounded-xl border">
              <summary className="text-muted-foreground hover:text-foreground flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs font-semibold tracking-wide uppercase [&::-webkit-details-marker]:hidden">
                Editar detalhes da parte (avançado)
                {detailsDirty && (
                  <span className="bg-warning/10 text-warning rounded-full px-2 py-0.5 text-xs font-semibold normal-case">
                    alterado
                  </span>
                )}
              </summary>

              <div className="space-y-4 border-t px-4 py-4">
                <Field label="Tema / título">
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    aria-label="Tema ou título da parte"
                  />
                </Field>

                <Field label="Subtítulo">
                  <Input
                    value={subtitle}
                    onChange={(event) => setSubtitle(event.target.value)}
                    aria-label="Subtítulo da parte"
                  />
                </Field>

                <div className="grid grid-cols-3 gap-3">
                  <Field label="Início">
                    <Input
                      type="time"
                      step={60}
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      aria-label="Horário de início"
                    />
                  </Field>
                  <Field label="Duração (min)">
                    <Input
                      type="number"
                      min={0}
                      max={600}
                      value={duration}
                      onChange={(event) => setDuration(event.target.value)}
                      aria-label="Duração em minutos"
                      className="tabular-nums"
                    />
                  </Field>
                  <Field label="Cântico">
                    <Input
                      type="number"
                      min={1}
                      max={300}
                      value={songNumber}
                      onChange={(event) => setSongNumber(event.target.value)}
                      placeholder="—"
                      aria-label="Número do cântico"
                      className="tabular-nums"
                    />
                  </Field>
                </div>

                {diffLines.length > 0 && (
                  <div className="bg-muted/50 space-y-1 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Antes → depois
                    </p>
                    {diffLines.map((line) => (
                      <p key={line} className="text-xs leading-snug">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </details>
          </div>

          <DialogFooter className="border-t px-5 py-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
