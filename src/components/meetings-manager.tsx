"use client";

import { FileUp, Loader2, Music, Pencil, Trash2 } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
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

        <TabsContent value="midweek">
          <WorkbookList
            rows={byType.MIDWEEK}
            canEdit={canEdit}
            onEdit={(row) =>
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
              })
            }
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        </TabsContent>

        <TabsContent value="weekend">
          <WorkbookList
            rows={byType.WEEKEND}
            canEdit={canEdit}
            onEdit={(row) =>
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
              })
            }
            onDelete={handleDelete}
            deletingId={deletingId}
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
}: {
  rows: MeetingWorkbookRow[];
  canEdit: boolean;
  onEdit: (row: MeetingWorkbookRow) => void;
  onDelete: (row: MeetingWorkbookRow) => void;
  deletingId: string | null;
}) {
  if (rows.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <Music className="text-muted-foreground size-8" aria-hidden="true" />
          <p className="text-sm font-medium">Nenhuma apostila importada</p>
          <p className="text-muted-foreground text-xs">
            {canEdit
              ? "Importe um arquivo .jwpub para começar."
              : "Entre em contato com um organizador para importar a apostila."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {rows.map((row) => (
        <Card key={row.id}>
          <CardContent className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{row.name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {row.symbol} · {row.content.weeks.length} semanas ·{" "}
                {new Date(row.updatedAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            {canEdit && (
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(row)}
                  aria-label="Editar"
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(row)}
                  disabled={deletingId === row.id}
                  aria-label="Excluir"
                  className="text-destructive hover:text-destructive"
                >
                  {deletingId === row.id ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 />
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
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
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar apostila</DialogTitle>
          <DialogDescription>{draft.symbol}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Nome" className="sm:col-span-2">
              <Input
                value={draft.name}
                onChange={(event) => onChange({ ...draft, name: event.target.value })}
              />
            </Field>
            <Field label="Título curto">
              <Input
                value={draft.shortTitle ?? ""}
                onChange={(event) => onChange({ ...draft, shortTitle: event.target.value })}
              />
            </Field>
            <Field label="Título de exibição">
              <Input
                value={draft.displayTitle ?? ""}
                onChange={(event) => onChange({ ...draft, displayTitle: event.target.value })}
              />
            </Field>
            <Field label="Título de referência">
              <Input
                value={draft.referenceTitle ?? ""}
                onChange={(event) => onChange({ ...draft, referenceTitle: event.target.value })}
              />
            </Field>
            <Field label="Código de idioma">
              <Input
                value={draft.languageCode ?? ""}
                onChange={(event) => onChange({ ...draft, languageCode: event.target.value })}
              />
            </Field>
          </div>

          <Separator />

          <div className="grid gap-2 sm:grid-cols-2">
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

          {content.additionalInformation && (
            <div className="space-y-2">
              <Separator />
              <p className="text-sm font-medium">Informações adicionais</p>
              <div className="grid gap-2 sm:grid-cols-2">
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
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
            Salvar
          </Button>
        </DialogFooter>
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
    <div className={cn("space-y-1", className)}>
      <Label className="text-xs">{label}</Label>
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
  return (
    <details className="rounded-lg border" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-medium">{week.week || "Semana"}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onRemove();
          }}
          aria-label="Remover semana"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </summary>

      <div className="space-y-3 border-t px-3 py-3">
        <div className="grid gap-2 sm:grid-cols-2">
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

        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Cântico inicial">
            <Input
              value={week.meeting.openingSong ?? ""}
              onChange={(event) =>
                onChange({ ...week, meeting: { ...week.meeting, openingSong: event.target.value } })
              }
            />
          </Field>
          <Field label="Oração inicial">
            <Checkbox
              checked={week.meeting.openingPrayer ?? false}
              onCheckedChange={(checked) =>
                onChange({
                  ...week,
                  meeting: { ...week.meeting, openingPrayer: checked === true },
                })
              }
            />
          </Field>
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
            <div key={sectionKey} className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">
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

        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Cântico final">
            <Input
              value={week.meeting.closingSong ?? ""}
              onChange={(event) =>
                onChange({ ...week, meeting: { ...week.meeting, closingSong: event.target.value } })
              }
            />
          </Field>
          <Field label="Oração final">
            <Checkbox
              checked={week.meeting.closingPrayer ?? false}
              onCheckedChange={(checked) =>
                onChange({
                  ...week,
                  meeting: { ...week.meeting, closingPrayer: checked === true },
                })
              }
            />
          </Field>
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
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-medium">
          {part.number ?? "–"}
        </span>
        <Input
          value={part.title}
          onChange={(event) => onChange({ ...part, title: event.target.value })}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          onClick={onRemove}
          aria-label="Remover parte"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
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
            rows={2}
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
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="space-y-1.5">
        {values.map((value, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: editable list, items never reorder
          <div key={index} className="flex items-start gap-1.5">
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
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              aria-label="Remover linha"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" type="button" onClick={() => onChange([...values, ""])}>
        Adicionar linha
      </Button>
    </div>
  );
}
