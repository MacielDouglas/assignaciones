"use client";

import {
  ArrowUpFromLine,
  CalendarDays,
  ChevronDown,
  FileUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiFetch, getErrorMessage } from "@/lib/api-client";
import type { WorkbookContent, WorkbookPart, WorkbookWeek } from "@/lib/jwpub";
import { cn } from "@/lib/utils";

export interface MeetingWorkbookRow {
  id: string;
  symbol: string;
  name: string;
  meetingType: "MIDWEEK" | "WEEKEND";
  shortTitle: string | null;
  displayTitle: string | null;
  referenceTitle: string | null;
  languageCode: string | null;
  coverImageUrl: string | null;
  content: WorkbookContent;
  updatedAt: string;
}

type TabKey = "midweek" | "weekend";

interface EditorDraft {
  meetingType: "MIDWEEK" | "WEEKEND";
  symbol: string;
  name: string;
  shortTitle?: string;
  displayTitle?: string;
  referenceTitle?: string;
  languageCode?: string;
  coverImageUrl?: string;
  content: WorkbookContent;
}

const SECTION_LABELS: Record<string, string> = {
  "TREASURES FROM GODS WORD": "Tesoros de la Biblia",
  "APPLY YOURSELF TO THE FIELD MINISTRY": "Seamos mejores maestros",
  "LIVING AS CHRISTIANS": "Nuestra vida cristiana",
};

interface MeetingsManagerProps {
  organizationId: string;
  initialMidweek: MeetingWorkbookRow[];
  initialWeekend: MeetingWorkbookRow[];
  canEdit: boolean;
}

export function MeetingsManager({
  organizationId,
  initialMidweek,
  initialWeekend,
  canEdit,
}: MeetingsManagerProps) {
  const [byType, setByType] = useState<
    Record<MeetingWorkbookRow["meetingType"], MeetingWorkbookRow[]>
  >({ MIDWEEK: initialMidweek, WEEKEND: initialWeekend });
  const [tab, setTab] = useState<TabKey>("midweek");
  const [draft, setDraft] = useState<EditorDraft | null>(null);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function upsertRow(row: MeetingWorkbookRow) {
    setByType((prev) => {
      const list = prev[row.meetingType].filter((item) => item.symbol !== row.symbol);
      return { ...prev, [row.meetingType]: [row, ...list] };
    });
  }

  function openEditor(row: MeetingWorkbookRow) {
    setDraft({
      meetingType: row.meetingType,
      symbol: row.symbol,
      name: row.name,
      shortTitle: row.shortTitle ?? undefined,
      displayTitle: row.displayTitle ?? undefined,
      referenceTitle: row.referenceTitle ?? undefined,
      languageCode: row.languageCode ?? undefined,
      coverImageUrl: row.coverImageUrl ?? undefined,
      content: row.content,
    });
  }

  async function handleImportFile(file: File) {
    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(`/api/organizations/${organizationId}/meetings/import`, {
        method: "POST",
        body: form,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : `Erro ${response.status}.`;
        throw new ApiError(message, response.status);
      }
      const workbook = (data as { workbook: EditorDraft }).workbook;
      setDraft({
        meetingType: tab === "midweek" ? "MIDWEEK" : "WEEKEND",
        symbol: workbook.symbol,
        name: workbook.name,
        shortTitle: workbook.shortTitle,
        displayTitle: workbook.displayTitle,
        referenceTitle: workbook.referenceTitle,
        languageCode: workbook.languageCode,
        coverImageUrl: workbook.coverImageUrl,
        content: workbook.content,
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave(nextDraft: EditorDraft) {
    setSaving(true);
    try {
      const { meeting } = await apiFetch<{ meeting: MeetingWorkbookRow }>(
        `/api/organizations/${organizationId}/meetings`,
        { method: "POST", body: JSON.stringify(nextDraft) },
      );
      upsertRow(meeting);
      setDraft(null);
      toast.success("Apostila salva!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: MeetingWorkbookRow) {
    if (!window.confirm(`Excluir a apostila "${row.name}"?`)) return;
    setDeletingId(row.id);
    try {
      await apiFetch(`/api/organizations/${organizationId}/meetings/${row.id}`, {
        method: "DELETE",
      });
      setByType((prev) => ({
        ...prev,
        [row.meetingType]: prev[row.meetingType].filter((item) => item.id !== row.id),
      }));
      toast.success("Apostila excluída.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="midweek">Meio de semana</TabsTrigger>
            <TabsTrigger value="weekend">Fim de semana</TabsTrigger>
          </TabsList>

          {canEdit && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jwpub"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleImportFile(file);
                }}
              />
              <Button
                variant="outline"
                className="w-full rounded-full sm:w-auto"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                {importing ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <FileUp aria-hidden="true" />
                )}
                Importar .jwpub
              </Button>
            </>
          )}
        </div>

        <TabsContent value="midweek" className="mt-6">
          <WorkbookList
            rows={byType.MIDWEEK}
            canEdit={canEdit}
            onEdit={openEditor}
            onDelete={handleDelete}
            deletingId={deletingId}
            onImport={() => fileInputRef.current?.click()}
            importing={importing}
          />
        </TabsContent>

        <TabsContent value="weekend" className="mt-6">
          <WorkbookList
            rows={byType.WEEKEND}
            canEdit={canEdit}
            onEdit={openEditor}
            onDelete={handleDelete}
            deletingId={deletingId}
            onImport={() => fileInputRef.current?.click()}
            importing={importing}
          />
        </TabsContent>
      </Tabs>

      {draft && (
        <MeetingsEditor
          draft={draft}
          saving={saving}
          onChange={setDraft}
          onCancel={() => setDraft(null)}
          onSave={() => handleSave(draft)}
        />
      )}
    </div>
  );
}

function WorkbookList({
  rows,
  canEdit,
  onEdit,
  onDelete,
  deletingId,
  onImport,
  importing,
}: {
  rows: MeetingWorkbookRow[];
  canEdit: boolean;
  onEdit: (row: MeetingWorkbookRow) => void;
  onDelete: (row: MeetingWorkbookRow) => void;
  deletingId: string | null;
  onImport: () => void;
  importing: boolean;
}) {
  if (rows.length === 0) {
    return (
      <Card className="overflow-hidden rounded-2xl border">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center sm:py-20">
          <div className="bg-muted flex size-14 items-center justify-center rounded-2xl">
            <CalendarDays className="text-muted-foreground size-6" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <p className="text-lg font-semibold tracking-tight">Nenhuma apostila importada</p>
            <p className="text-muted-foreground mx-auto max-w-xs text-sm">
              {canEdit
                ? "Importe o arquivo .jwpub da reunião para começar a montar a escala."
                : "Entre em contato com um organizador para importar a apostila."}
            </p>
          </div>
          {canEdit && (
            <Button className="mt-2 rounded-full" onClick={onImport} disabled={importing}>
              {importing ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <ArrowUpFromLine aria-hidden="true" />
              )}
              Importar apostila
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border bg-card">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-3 px-5 py-4">
          <button
            type="button"
            onClick={() => onEdit(row)}
            className="min-w-0 flex-1 cursor-pointer text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-xl"
          >
            <p className="text-sm font-medium truncate">{row.name}</p>
            <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
              <span className="tabular-nums">{row.content.weeks.length} semanas</span>
              <span aria-hidden="true">·</span>
              <span>atualizado em {new Date(row.updatedAt).toLocaleDateString("pt-BR")}</span>
            </p>
          </button>
          {canEdit && (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => onEdit(row)}
                aria-label="Editar apostila"
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive rounded-full hover:text-destructive"
                onClick={() => onDelete(row)}
                disabled={deletingId === row.id}
                aria-label="Excluir apostila"
              >
                {deletingId === row.id ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 />
                )}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MeetingsEditor({
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
        className="max-h-[90vh] max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <header className="flex items-start justify-between gap-4 border-b px-6 py-5">
          <div className="min-w-0 space-y-1">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Editar apostila
            </DialogTitle>
            <DialogDescription className="text-muted-foreground truncate text-sm">
              {draft.name} · {draft.symbol}
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onCancel}
            disabled={saving}
            aria-label="Fechar"
          >
            <X />
          </Button>
        </header>

        <div className="max-h-[calc(90vh-10rem)] overflow-y-auto px-6 py-6">
          <div className="space-y-10">
            <section className="space-y-4">
              <h3 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                Identificação
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome" className="sm:col-span-2">
                  <Input
                    className="h-9"
                    value={draft.name}
                    onChange={(event) => onChange({ ...draft, name: event.target.value })}
                  />
                </Field>
                <Field label="Título curto">
                  <Input
                    className="h-9"
                    value={draft.shortTitle ?? ""}
                    onChange={(event) => onChange({ ...draft, shortTitle: event.target.value })}
                  />
                </Field>
                <Field label="Título de exibição">
                  <Input
                    className="h-9"
                    value={draft.displayTitle ?? ""}
                    onChange={(event) => onChange({ ...draft, displayTitle: event.target.value })}
                  />
                </Field>
                <Field label="Título de referência">
                  <Input
                    className="h-9"
                    value={draft.referenceTitle ?? ""}
                    onChange={(event) => onChange({ ...draft, referenceTitle: event.target.value })}
                  />
                </Field>
                <Field label="Código de idioma">
                  <Input
                    className="h-9"
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
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Volume">
                  <Input
                    className="h-9"
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
                    className="h-9"
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Semana">
                    <Input
                      className="h-9"
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
                      className="h-9"
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
                      className="h-9"
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
                      className="h-9"
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

        <footer className="flex justify-end gap-2 border-t bg-background px-6 py-4">
          <Button variant="outline" className="rounded-full" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button className="rounded-full" onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
            Salvar
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-muted-foreground text-xs font-medium">{label}</Label>
      {children}
    </div>
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
          size="icon-sm"
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Semana">
            <Input
              className="h-9"
              value={week.week}
              onChange={(event) => onChange({ ...week, week: event.target.value })}
            />
          </Field>
          <Field label="Leitura da Bíblia">
            <Input
              className="h-9"
              value={week.BibleReading}
              onChange={(event) => onChange({ ...week, BibleReading: event.target.value })}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cântico inicial">
            <Input
              className="h-9"
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
                id="opening-prayer"
                checked={week.meeting.openingPrayer ?? false}
                onCheckedChange={(checked) =>
                  onChange({
                    ...week,
                    meeting: { ...week.meeting, openingPrayer: checked === true },
                  })
                }
              />
              <Label
                htmlFor="opening-prayer"
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
              {parts.map((part, partIndex) => (
                <PartEditor
                  key={`${sectionKey}-${part.number ?? ""}-${part.title}`}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cântico final">
            <Input
              className="h-9"
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
                id="closing-prayer"
                checked={week.meeting.closingPrayer ?? false}
                onCheckedChange={(checked) =>
                  onChange({
                    ...week,
                    meeting: { ...week.meeting, closingPrayer: checked === true },
                  })
                }
              />
              <Label
                htmlFor="closing-prayer"
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
          className="h-9 flex-1"
          value={part.title}
          onChange={(event) => onChange({ ...part, title: event.target.value })}
          aria-label="Título da parte"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          className="text-destructive rounded-full hover:text-destructive"
          onClick={onRemove}
          aria-label="Remover parte"
        >
          <Trash2 />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {part.duration !== undefined && (
          <Field label="Duração">
            <Input
              className="h-9"
              value={part.duration}
              onChange={(event) => onChange({ ...part, duration: event.target.value })}
            />
          </Field>
        )}
        {part.format !== undefined && (
          <Field label="Formato">
            <Input
              className="h-9"
              value={part.format}
              onChange={(event) => onChange({ ...part, format: event.target.value })}
            />
          </Field>
        )}
        {part.territory !== undefined && (
          <Field label="Território">
            <Input
              className="h-9"
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
              size="icon-sm"
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
        className="rounded-full"
        onClick={() => onChange([...values, ""])}
      >
        <Plus aria-hidden="true" />
        Adicionar linha
      </Button>
    </div>
  );
}
