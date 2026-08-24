import { ChevronDown, Loader2, Plus, Trash2, X } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { WorkbookContent, WorkbookPart, WorkbookWeek } from "@/features/meetings/lib/jwpub";
import { Field } from "./field";
import { type EditorDraft, SECTION_LABELS } from "./types";

export function MeetingsEditor({
  draft,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  draft: EditorDraft;
  saving: boolean;
  onChange: (draft: EditorDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const content = draft.content;

  function update(fn: (content: WorkbookContent) => void) {
    const next = structuredClone(draft);
    fn(next.content);
    onChange(next);
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onCancel();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex h-dvh max-h-dvh max-w-3xl flex-col gap-0 overflow-hidden rounded-t-none border-x-0 border-b-0 p-0 sm:h-auto sm:max-h-[85vh] sm:rounded-2xl sm:border-x sm:border-b"
      >
        <header className="flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0 space-y-1">
            <DialogTitle className="text-lg font-semibold tracking-tight sm:text-xl">
              Editar apostila
            </DialogTitle>
            <DialogDescription className="text-muted-foreground truncate text-sm">
              {draft.name} · {draft.symbol}
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={saving}
            aria-label="Fechar"
          >
            <X />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="space-y-9">
            <section className="space-y-4">
              <h3 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                Identificação
              </h3>
              <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
                <Field label="Nome" className="sm:col-span-2">
                  <Input
                    value={draft.name}
                    onChange={(event) => onChange({ ...draft, name: event.target.value })}
                  />
                </Field>
                <Field label="Título de exibição">
                  <Input
                    value={draft.displayTitle ?? ""}
                    onChange={(event) => onChange({ ...draft, displayTitle: event.target.value })}
                  />
                </Field>
                <Field label="Código de idioma">
                  <Input
                    value={draft.languageCode ?? ""}
                    onChange={(event) => onChange({ ...draft, languageCode: event.target.value })}
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                Capa
              </h3>
              <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
                <Field label="Volume">
                  <Input
                    value={content.coverInformation?.volume ?? ""}
                    onChange={(event) =>
                      update((c) => {
                        c.coverInformation = {
                          symbol: c.coverInformation?.symbol ?? draft.symbol,
                          volume: event.target.value,
                        };
                      })
                    }
                  />
                </Field>
                <Field label="Imagem da capa">
                  <Input
                    value={content.coverInformation?.coverImage ?? ""}
                    onChange={(event) =>
                      update((c) => {
                        c.coverInformation = {
                          symbol: c.coverInformation?.symbol ?? draft.symbol,
                          coverImage: event.target.value,
                        };
                      })
                    }
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                Semanas · {content.weeks.length}
              </h3>
              <div className="space-y-3">
                {content.weeks.map((week, weekIndex) => (
                  <WeekCard
                    key={week.week || `week-${weekIndex}`}
                    week={week}
                    onChange={(nextWeek) =>
                      update((c) => {
                        c.weeks[weekIndex] = nextWeek;
                      })
                    }
                    onRemove={() =>
                      update((c) => {
                        c.weeks.splice(weekIndex, 1);
                      })
                    }
                  />
                ))}
              </div>
            </section>

            {content.additionalInformation && (
              <section className="space-y-4">
                <h3 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                  Informações adicionais
                </h3>
                <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
                  <Field label="Semana">
                    <Input
                      value={content.additionalInformation.week}
                      onChange={(event) =>
                        update((c) => {
                          const ai = c.additionalInformation;
                          if (ai) ai.week = event.target.value;
                        })
                      }
                    />
                  </Field>
                  <Field label="Título">
                    <Input
                      value={content.additionalInformation.title}
                      onChange={(event) =>
                        update((c) => {
                          const ai = c.additionalInformation;
                          if (ai) ai.title = event.target.value;
                        })
                      }
                    />
                  </Field>
                  <Field label="Duração">
                    <Input
                      value={content.additionalInformation.duration}
                      onChange={(event) =>
                        update((c) => {
                          const ai = c.additionalInformation;
                          if (ai) ai.duration = event.target.value;
                        })
                      }
                    />
                  </Field>
                  <Field label="Vídeo">
                    <Input
                      value={content.additionalInformation.video ?? ""}
                      onChange={(event) =>
                        update((c) => {
                          const ai = c.additionalInformation;
                          if (ai) ai.video = event.target.value;
                        })
                      }
                    />
                  </Field>
                  <Field label="Conteúdo" className="sm:col-span-2">
                    <Textarea
                      rows={5}
                      value={content.additionalInformation.content ?? ""}
                      onChange={(event) =>
                        update((c) => {
                          const ai = c.additionalInformation;
                          if (ai) ai.content = event.target.value;
                        })
                      }
                    />
                  </Field>
                </div>
              </section>
            )}
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-2.5 border-t bg-background px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:gap-2 sm:px-6 sm:pb-4">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button className="w-full sm:w-auto" onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
            Salvar
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

function WeekCard({
  week,
  onChange,
  onRemove,
}: {
  week: WorkbookWeek;
  onChange: (week: WorkbookWeek) => void;
  onRemove: () => void;
}) {
  const openingPrayerId = useId();
  const closingPrayerId = useId();
  const partCount = [
    week.meeting["TREASURES FROM GODS WORD"],
    week.meeting["APPLY YOURSELF TO THE FIELD MINISTRY"],
    week.meeting["LIVING AS CHRISTIANS"],
  ].reduce((total, parts) => total + (parts?.length ?? 0), 0);

  return (
    <details className="group overflow-hidden rounded-xl border bg-card" open>
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <ChevronDown
          className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{week.week || "Semana"}</p>
          <p className="text-muted-foreground truncate text-xs">
            {week.BibleReading} · {partCount} {partCount === 1 ? "parte" : "partes"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="text-destructive rounded-full hover:text-destructive"
          onClick={(event) => {
            event.preventDefault();
            onRemove();
          }}
          aria-label="Remover semana"
        >
          <Trash2 />
        </Button>
      </summary>

      <div className="space-y-5 border-t px-4 py-4 sm:px-5 sm:py-5">
        <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
          <Field label="Semana">
            <Input
              value={week.week}
              onChange={(event) => onChange({ ...week, week: event.target.value })}
            />
          </Field>
          <Field label="Leitura da Bíblia">
            <Input
              value={week.BibleReading}
              onChange={(event) => onChange({ ...week, BibleReading: event.target.value })}
            />
          </Field>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
          <Field label="Cântico inicial">
            <Input
              value={week.meeting.openingSong ?? ""}
              onChange={(event) =>
                onChange({
                  ...week,
                  meeting: { ...week.meeting, openingSong: event.target.value },
                })
              }
            />
          </Field>
          <div className="flex items-end pb-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id={openingPrayerId}
                checked={week.meeting.openingPrayer ?? false}
                onCheckedChange={(checked) =>
                  onChange({
                    ...week,
                    meeting: { ...week.meeting, openingPrayer: checked === true },
                  })
                }
              />
              <Label
                htmlFor={openingPrayerId}
                className="text-muted-foreground cursor-pointer text-sm font-medium"
              >
                Oração inicial
              </Label>
            </div>
          </div>
        </div>

        {week.meeting.openingComments !== undefined && (
          <Field label="Comentários iniciais">
            <Textarea
              rows={3}
              value={week.meeting.openingComments}
              onChange={(event) =>
                onChange({
                  ...week,
                  meeting: { ...week.meeting, openingComments: event.target.value },
                })
              }
            />
          </Field>
        )}

        {(
          [
            "TREASURES FROM GODS WORD",
            "APPLY YOURSELF TO THE FIELD MINISTRY",
            "LIVING AS CHRISTIANS",
          ] as const
        ).map((sectionKey) => {
          const parts = week.meeting[sectionKey];
          if (!parts) return null;
          return (
            <div key={sectionKey} className="space-y-3">
              <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                {SECTION_LABELS[sectionKey] ?? sectionKey}
              </p>
              {sectionKey === "LIVING AS CHRISTIANS" && (
                <Field label="Cântico do meio">
                  <Input
                    value={week.meeting.middleSong ?? ""}
                    onChange={(event) =>
                      onChange({
                        ...week,
                        meeting: { ...week.meeting, middleSong: event.target.value },
                      })
                    }
                    placeholder="Ex.: Canción 12"
                  />
                </Field>
              )}
              {parts.map((part, partIndex) => (
                <PartEditor
                  // biome-ignore lint/suspicious/noArrayIndexKey: editable list, items never reorder
                  key={`${sectionKey}-${partIndex}`}
                  part={part}
                  onChange={(nextPart) => {
                    const next = parts.map((p, i) => (i === partIndex ? nextPart : p));
                    onChange({ ...week, meeting: { ...week.meeting, [sectionKey]: next } });
                  }}
                  onRemove={() => {
                    const next = parts.filter((_, i) => i !== partIndex);
                    onChange({ ...week, meeting: { ...week.meeting, [sectionKey]: next } });
                  }}
                />
              ))}
            </div>
          );
        })}

        {week.meeting.concludingComments !== undefined && (
          <Field label="Comentários finais">
            <Textarea
              rows={3}
              value={week.meeting.concludingComments}
              onChange={(event) =>
                onChange({
                  ...week,
                  meeting: { ...week.meeting, concludingComments: event.target.value },
                })
              }
            />
          </Field>
        )}

        <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
          <Field label="Cântico final">
            <Input
              value={week.meeting.closingSong ?? ""}
              onChange={(event) =>
                onChange({
                  ...week,
                  meeting: { ...week.meeting, closingSong: event.target.value },
                })
              }
            />
          </Field>
          <div className="flex items-end pb-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id={closingPrayerId}
                checked={week.meeting.closingPrayer ?? false}
                onCheckedChange={(checked) =>
                  onChange({
                    ...week,
                    meeting: { ...week.meeting, closingPrayer: checked === true },
                  })
                }
              />
              <Label
                htmlFor={closingPrayerId}
                className="text-muted-foreground cursor-pointer text-sm font-medium"
              >
                Oração final
              </Label>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}

function PartEditor({
  part,
  onChange,
  onRemove,
}: {
  part: WorkbookPart;
  onChange: (part: WorkbookPart) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <span className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-medium tabular-nums">
          {part.number ?? "–"}
        </span>
        <Input
          className="flex-1"
          value={part.title}
          onChange={(event) => onChange({ ...part, title: event.target.value })}
          aria-label="Título da parte"
        />
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="text-destructive rounded-full hover:text-destructive"
          onClick={onRemove}
          aria-label="Remover parte"
        >
          <Trash2 />
        </Button>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-3 sm:gap-4">
        {part.duration !== undefined && (
          <Field label="Duração">
            <Input
              value={part.duration}
              onChange={(event) => onChange({ ...part, duration: event.target.value })}
            />
          </Field>
        )}
        {part.format !== undefined && (
          <Field label="Formato">
            <Input
              value={part.format}
              onChange={(event) => onChange({ ...part, format: event.target.value })}
            />
          </Field>
        )}
        {part.territory !== undefined && (
          <Field label="Território">
            <Input
              value={part.territory}
              onChange={(event) => onChange({ ...part, territory: event.target.value })}
            />
          </Field>
        )}
      </div>

      {part.assignment !== undefined && (
        <Field label="Designação">
          <Textarea
            rows={3}
            value={part.assignment}
            onChange={(event) => onChange({ ...part, assignment: event.target.value })}
          />
        </Field>
      )}

      {typeof part.content === "string" && (
        <Field label="Conteúdo">
          <Textarea
            rows={4}
            value={part.content}
            onChange={(event) => onChange({ ...part, content: event.target.value })}
          />
        </Field>
      )}

      {Array.isArray(part.content) && (
        <StringList
          label="Conteúdo"
          values={part.content}
          onChange={(content) => onChange({ ...part, content })}
        />
      )}

      {Array.isArray(part.questions) && (
        <StringList
          label="Perguntas"
          values={part.questions}
          onChange={(questions) => onChange({ ...part, questions })}
        />
      )}
    </div>
  );
}

function StringList({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <div className="space-y-2">
        {values.map((value, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: editable list, items never reorder
          <div key={index} className="flex items-start gap-2">
            <Textarea
              rows={2}
              value={value}
              onChange={(event) => {
                const next = [...values];
                next[index] = event.target.value;
                onChange(next);
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="text-destructive rounded-full hover:text-destructive"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              aria-label="Remover linha"
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        type="button"
        className="w-full sm:w-auto"
        onClick={() => onChange([...values, ""])}
      >
        <Plus aria-hidden="true" />
        Adicionar linha
      </Button>
    </div>
  );
}
