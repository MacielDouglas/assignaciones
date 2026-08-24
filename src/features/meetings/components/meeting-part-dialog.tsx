"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
 * Edição rápida de uma parte da programação (owner/admin): título,
 * subtítulo, horário de início, duração, cântico e designados.
 *
 * O chevron ">" da linha é o gatilho; a persistência acontece no servidor
 * (`/meetings/program-part`), que grava overrides no JSON da apostila e
 * mescla as designações na programação salva.
 */
export function MeetingPartDialog({
  organizationId,
  weekStartIso,
  meetingType,
  part,
  roster,
  assignedPersonIds,
}: {
  organizationId: string;
  weekStartIso: string;
  meetingType: "MIDWEEK" | "WEEKEND";
  part: MeetingPart;
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

  async function handleSave() {
    setSaving(true);
    try {
      const trimmedTitle = title.trim();
      await apiFetch(`/api/organizations/${organizationId}/meetings/program-part`, {
        method: "POST",
        body: JSON.stringify({
          weekStart: weekStartIso,
          meetingType,
          partId: part.id,
          overrides: {
            ...(trimmedTitle ? { title: trimmedTitle } : {}),
            subtitle,
            startTime: startTime === "" ? null : startTime,
            durationMinutes: Number(duration) || 0,
            songNumber: songNumber === "" ? null : Number(songNumber),
          },
          slots: part.slots.map((slot) => ({
            slotId: slot.id,
            label: slot.label,
            kind: slot.kind,
            personId: slotPersons[slot.id] || null,
          })),
        }),
      });
      setOpen(false);
      router.refresh();
      toast.success("Parte atualizada!");
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
        className="text-muted-foreground/60 hover:text-foreground size-8 rounded-full"
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
        aria-label={`Editar ${part.title}`}
      >
        <ChevronRight className="size-5" aria-hidden="true" />
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
              Editar parte
            </DialogTitle>
            <DialogDescription className="truncate text-sm">
              {part.time ? `${part.time} · ` : ""}
              {part.duration} min
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
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

            {part.slots.length > 0 && (
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Designados
                </p>
                {part.slots.map((slot) => {
                  const studentSlot = part.slots.find(
                    (candidate) => candidate.id === `${part.id}-student`,
                  );
                  return (
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
                  );
                })}
              </div>
            )}
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
