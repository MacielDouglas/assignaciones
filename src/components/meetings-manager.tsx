"use client";

import {
  AlertTriangle,
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
import type { WatchtowerArticle, WorkbookContent, WorkbookPart, WorkbookWeek } from "@/lib/jwpub";
import { cn } from "@/lib/utils";
import {
  type WorkbookLanguage,
  workbookIssueKey,
  workbookLanguage,
  workbookMonthRange,
} from "@/lib/workbook-meta";

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

export interface WatchtowerRow {
  id: string;
  symbol: string;
  name: string;
  languageCode: string | null;
  fileName: string | null;
  updatedAt: string;
  articles: WatchtowerArticle[];
}

export interface CatalogRow {
  id: string;
  number: number;
  theme: string;
  updatedAt: string;
}

interface CatalogItem {
  number: number;
  theme: string;
}

type TabKey = "workbook" | "watchtower" | "songs" | "talks";

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

interface WatchtowerDraft {
  symbol: string;
  name: string;
  languageCode?: string;
  articles: WatchtowerArticle[];
}

interface PendingImport {
  kind: "workbook";
  draft: EditorDraft;
}

interface PendingWatchtowerImport {
  kind: "watchtower";
  draft: WatchtowerDraft;
}

interface PendingCatalogImport {
  kind: "songs" | "talks";
  symbol: string;
  name: string;
  items: CatalogItem[];
}

interface CatalogDraft {
  kind: "songs" | "talks";
  symbol: string;
  name: string;
  items: CatalogItem[];
}

const SECTION_LABELS: Record<string, string> = {
  "TREASURES FROM GODS WORD": "Tesoros de la Biblia",
  "APPLY YOURSELF TO THE FIELD MINISTRY": "Seamos mejores maestros",
  "LIVING AS CHRISTIANS": "Nuestra vida cristiana",
};

interface MeetingsManagerProps {
  organizationId: string;
  initialMidweek: MeetingWorkbookRow[];
  initialWatchtowers: WatchtowerRow[];
  initialSongs: CatalogRow[];
  initialTalks: CatalogRow[];
  canEdit: boolean;
}

export function MeetingsManager({
  organizationId,
  initialMidweek,
  initialWatchtowers,
  initialSongs,
  initialTalks,
  canEdit,
}: MeetingsManagerProps) {
  const [workbooks, setWorkbooks] = useState<MeetingWorkbookRow[]>(initialMidweek);
  const [watchtowers, setWatchtowers] = useState<WatchtowerRow[]>(initialWatchtowers);
  const [songs, setSongs] = useState<CatalogRow[]>(initialSongs);
  const [talks, setTalks] = useState<CatalogRow[]>(initialTalks);
  const [tab, setTab] = useState<TabKey>("workbook");
  const [language, setLanguage] = useState<WorkbookLanguage>("es");
  const [draft, setDraft] = useState<EditorDraft | null>(null);
  const [wtDraft, setWtDraft] = useState<WatchtowerDraft | null>(null);
  const [catalogDraft, setCatalogDraft] = useState<CatalogDraft | null>(null);
  const [duplicate, setDuplicate] = useState<
    (PendingImport | PendingWatchtowerImport | PendingCatalogImport) | null
  >(null);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function upsertWorkbookRow(row: MeetingWorkbookRow) {
    setWorkbooks((prev) =>
      prev
        .filter((item) => item.symbol !== row.symbol)
        .concat(row)
        .sort((a, b) => workbookIssueKey(b.symbol) - workbookIssueKey(a.symbol)),
    );
  }

  function upsertWatchtowerRow(row: WatchtowerRow) {
    setWatchtowers((prev) =>
      prev
        .filter((item) => item.symbol !== row.symbol)
        .concat(row)
        .sort((a, b) => workbookIssueKey(b.symbol) - workbookIssueKey(a.symbol)),
    );
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

  function openWatchtowerEditor(row: WatchtowerRow) {
    setWtDraft({
      symbol: row.symbol,
      name: row.name,
      languageCode: row.languageCode ?? undefined,
      articles: row.articles.map((article) => ({ ...article })),
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
      const pending: PendingImport | PendingWatchtowerImport | PendingCatalogImport =
        data.kind === "watchtower"
          ? {
              kind: "watchtower" as const,
              draft: {
                symbol: data.watchtower.symbol,
                name: data.watchtower.name,
                languageCode: data.watchtower.languageCode,
                articles: data.watchtower.articles,
              } satisfies WatchtowerDraft,
            }
          : data.kind === "songs" || data.kind === "talks"
            ? {
                kind: data.kind,
                symbol: data.symbol,
                name: data.name,
                items: (data.kind === "songs" ? data.songs : data.talks) as CatalogItem[],
              }
            : {
                kind: "workbook" as const,
                draft: {
                  meetingType: data.meetingType as "MIDWEEK" | "WEEKEND",
                  symbol: data.workbook.symbol,
                  name: data.workbook.name,
                  shortTitle: data.workbook.shortTitle,
                  displayTitle: data.workbook.displayTitle,
                  referenceTitle: data.workbook.referenceTitle,
                  languageCode: data.workbook.languageCode,
                  coverImageUrl: data.workbook.coverImageUrl,
                  content: data.workbook.content,
                } satisfies EditorDraft,
              };
      if (data.exists) {
        setDuplicate(pending);
      } else if (pending.kind === "watchtower") {
        setWtDraft(pending.draft);
      } else if (pending.kind === "workbook") {
        setDraft(pending.draft);
      } else {
        setCatalogDraft({
          kind: pending.kind,
          symbol: pending.symbol,
          name: pending.name,
          items: pending.items,
        });
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSaveWorkbook(nextDraft: EditorDraft) {
    setSaving(true);
    try {
      const { meeting } = await apiFetch<{ meeting: MeetingWorkbookRow }>(
        `/api/organizations/${organizationId}/meetings`,
        { method: "POST", body: JSON.stringify(nextDraft) },
      );
      upsertWorkbookRow(meeting);
      setDraft(null);
      toast.success("Apostila salva!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWatchtower(nextDraft: WatchtowerDraft) {
    setSaving(true);
    try {
      const { watchtower } = await apiFetch<{ watchtower: WatchtowerRow }>(
        `/api/organizations/${organizationId}/watchtowers`,
        { method: "POST", body: JSON.stringify(nextDraft) },
      );
      upsertWatchtowerRow(watchtower);
      setWtDraft(null);
      toast.success("Sentinela salva!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteWorkbook(row: MeetingWorkbookRow) {
    if (!window.confirm(`Excluir a apostila "${row.name}"?`)) return;
    setDeletingId(row.id);
    try {
      await apiFetch(`/api/organizations/${organizationId}/meetings/${row.id}`, {
        method: "DELETE",
      });
      setWorkbooks((prev) => prev.filter((item) => item.id !== row.id));
      toast.success("Apostila excluída.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteWatchtower(row: WatchtowerRow) {
    if (!window.confirm(`Excluir a Sentinela "${row.name}"?`)) return;
    setDeletingId(row.id);
    try {
      await apiFetch(`/api/organizations/${organizationId}/watchtowers/${row.id}`, {
        method: "DELETE",
      });
      setWatchtowers((prev) => prev.filter((item) => item.id !== row.id));
      toast.success("Sentinela excluída.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  function mergeCatalogItems(existing: CatalogRow[], items: CatalogItem[]): CatalogItem[] {
    const merged = new Map<number, CatalogItem>();
    for (const item of items) merged.set(item.number, item);
    for (const row of existing) {
      if (!merged.has(row.number)) {
        merged.set(row.number, { number: row.number, theme: row.theme });
      }
    }
    return [...merged.values()].sort((a, b) => a.number - b.number);
  }

  async function handleSaveCatalog(nextDraft: CatalogDraft) {
    setSaving(true);
    try {
      const endpoint =
        nextDraft.kind === "songs"
          ? `/api/organizations/${organizationId}/songs`
          : `/api/organizations/${organizationId}/talks`;
      const { songs, talks: savedTalks } = await apiFetch<{
        songs?: CatalogRow[];
        talks?: CatalogRow[];
      }>(endpoint, { method: "POST", body: JSON.stringify({ items: nextDraft.items }) });
      if (nextDraft.kind === "songs" && songs) {
        setSongs(songs);
        toast.success("Cánticos salvos!");
      } else if (savedTalks) {
        setTalks(savedTalks);
        toast.success("Discursos salvos!");
      }
      setCatalogDraft(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
            <Tabs
              value={language}
              onValueChange={(value) => setLanguage(value as WorkbookLanguage)}
            >
              <TabsList className="w-full sm:w-fit">
                <TabsTrigger value="es">Español</TabsTrigger>
                <TabsTrigger value="pt">Português</TabsTrigger>
              </TabsList>
            </Tabs>
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="workbook">Apostila</TabsTrigger>
              <TabsTrigger value="watchtower">Sentinela</TabsTrigger>
              <TabsTrigger value="songs">Cánticos</TabsTrigger>
              <TabsTrigger value="talks">Discursos</TabsTrigger>
            </TabsList>
          </div>

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

        <TabsContent value="workbook" className="mt-6">
          <ContentList
            kind="workbook"
            language={language}
            rows={workbooks}
            canEdit={canEdit}
            onEdit={openEditor}
            onDelete={handleDeleteWorkbook}
            deletingId={deletingId}
            onImport={() => fileInputRef.current?.click()}
            importing={importing}
            itemCount={(row) => {
              const weeks = row.content.weeks.length;
              return `${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
            }}
          />
        </TabsContent>

        <TabsContent value="watchtower" className="mt-6">
          <ContentList
            kind="watchtower"
            language={language}
            rows={watchtowers}
            canEdit={canEdit}
            onEdit={openWatchtowerEditor}
            onDelete={handleDeleteWatchtower}
            deletingId={deletingId}
            onImport={() => fileInputRef.current?.click()}
            importing={importing}
            itemCount={(row) => {
              const articles = row.articles.length;
              return `${articles} ${articles === 1 ? "artículo" : "artículos"}`;
            }}
          />
        </TabsContent>

        <TabsContent value="songs" className="mt-6">
          <CatalogList
            kind="songs"
            rows={songs}
            canEdit={canEdit}
            onEdit={() =>
              setCatalogDraft({
                kind: "songs",
                symbol: songs[0]?.id ?? "sjj",
                name: "Cánticos",
                items: songs.map((row) => ({ number: row.number, theme: row.theme })),
              })
            }
            onImport={() => fileInputRef.current?.click()}
            importing={importing}
          />
        </TabsContent>

        <TabsContent value="talks" className="mt-6">
          <CatalogList
            kind="talks"
            rows={talks}
            canEdit={canEdit}
            onEdit={() =>
              setCatalogDraft({
                kind: "talks",
                symbol: talks[0]?.id ?? "S-34",
                name: "Discursos públicos",
                items: talks.map((row) => ({ number: row.number, theme: row.theme })),
              })
            }
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
          onSave={() => handleSaveWorkbook(draft)}
        />
      )}

      {wtDraft && (
        <WatchtowerEditor
          draft={wtDraft}
          saving={saving}
          onChange={setWtDraft}
          onCancel={() => setWtDraft(null)}
          onSave={() => handleSaveWatchtower(wtDraft)}
        />
      )}

      {catalogDraft && (
        <CatalogEditor
          draft={catalogDraft}
          saving={saving}
          onChange={setCatalogDraft}
          onCancel={() => setCatalogDraft(null)}
          onSave={() => handleSaveCatalog(catalogDraft)}
        />
      )}

      {duplicate && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setDuplicate(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <div className="flex items-start gap-4">
              <div className="bg-destructive/10 text-destructive flex size-11 shrink-0 items-center justify-center rounded-full">
                <AlertTriangle className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 space-y-1.5">
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  Arquivo já importado
                </DialogTitle>
                <DialogDescription className="text-sm">
                  O arquivo{" "}
                  <span className="font-medium text-foreground">
                    {"draft" in duplicate ? duplicate.draft.symbol : duplicate.symbol}
                  </span>{" "}
                  já está no banco de dados. Deseja atualizar{" "}
                  {duplicate.kind === "songs"
                    ? "a lista de cánticos"
                    : duplicate.kind === "talks"
                      ? "a lista de discursos"
                      : "o conteúdo"}{" "}
                  com este arquivo?
                </DialogDescription>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setDuplicate(null)}
              >
                Cancelar
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  const pending = duplicate;
                  setDuplicate(null);
                  if (pending.kind === "watchtower") setWtDraft(pending.draft);
                  else if (pending.kind === "workbook") setDraft(pending.draft);
                  else {
                    const existing = pending.kind === "songs" ? songs : talks;
                    setCatalogDraft({
                      kind: pending.kind,
                      symbol: pending.symbol,
                      name: pending.name,
                      items: mergeCatalogItems(existing, pending.items),
                    });
                  }
                }}
              >
                Atualizar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

type ContentRow = MeetingWorkbookRow | WatchtowerRow;

function ContentList<T extends ContentRow>({
  rows,
  language,
  canEdit,
  onEdit,
  onDelete,
  deletingId,
  onImport,
  importing,
  kind,
  itemCount,
}: {
  rows: T[];
  language: WorkbookLanguage;
  canEdit: boolean;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  deletingId: string | null;
  onImport: () => void;
  importing: boolean;
  kind: TabKey;
  itemCount: (row: T) => string;
}) {
  const filtered = rows.filter((row) => workbookLanguage(row.symbol) === language);
  const languageLabel = language === "es" ? "espanhol" : "português";
  const kindLabel = kind === "workbook" ? "apostila" : "sentinela";
  const kindTitle = kind === "workbook" ? "Apostila" : "Sentinela";

  if (filtered.length === 0) {
    return (
      <Card className="overflow-hidden rounded-2xl border">
        <CardContent className="flex flex-col items-center gap-4 px-5 py-10 text-center sm:px-6 sm:py-20">
          <div className="bg-muted flex size-14 items-center justify-center rounded-2xl">
            <CalendarDays className="text-muted-foreground size-6" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <p className="text-lg font-semibold tracking-tight">
              Nenhuma {kindLabel} em {languageLabel}
            </p>
            <p className="text-muted-foreground mx-auto max-w-xs text-sm">
              {canEdit
                ? `Importe o arquivo .jwpub em ${languageLabel} para começar a montar a escala.`
                : "Entre em contato com um organizador para importar o arquivo."}
            </p>
          </div>
          {canEdit && (
            <Button className="mt-2 rounded-full" onClick={onImport} disabled={importing}>
              {importing ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <ArrowUpFromLine aria-hidden="true" />
              )}
              Importar {kindLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border bg-card">
      {filtered.map((row) => {
        const range = workbookMonthRange(row.name, row.symbol);
        const count = itemCount(row);
        return (
          <div key={row.id} className="flex items-center gap-3 px-5 py-4">
            <button
              type="button"
              onClick={() => onEdit(row)}
              className="min-w-0 flex-1 cursor-pointer rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <p className="text-sm font-medium truncate">
                {row.symbol}
                {range ? ` - ${range}` : ""}
              </p>
              <p className="text-muted-foreground mt-0.5 truncate text-xs">{row.name}</p>
              <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 text-xs">
                <span className="tabular-nums">{count}</span>
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
                  aria-label={`Editar ${kindTitle}`}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive rounded-full hover:text-destructive"
                  onClick={() => onDelete(row)}
                  disabled={deletingId === row.id}
                  aria-label={`Excluir ${kindTitle}`}
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
        );
      })}
    </div>
  );
}

function CatalogList({
  kind,
  rows,
  canEdit,
  onEdit,
  onImport,
  importing,
}: {
  kind: "songs" | "talks";
  rows: CatalogRow[];
  canEdit: boolean;
  onEdit: () => void;
  onImport: () => void;
  importing: boolean;
}) {
  const title = kind === "songs" ? "Cánticos da congregação" : "Discursos públicos";
  const emptyLabel = kind === "songs" ? "Nenhum cántico importado" : "Nenhum discurso importado";
  const unit = kind === "songs" ? "cántico" : "discurso";
  const emptyHint = canEdit
    ? `Importe o arquivo .jwpub (${kind === "songs" ? "sjj" : "S-34"}) para preencher a lista.`
    : "Entre em contato com um organizador para importar o arquivo.";

  if (rows.length === 0) {
    return (
      <Card className="overflow-hidden rounded-2xl border">
        <CardContent className="flex flex-col items-center gap-4 px-5 py-10 text-center sm:px-6 sm:py-20">
          <div className="bg-muted flex size-14 items-center justify-center rounded-2xl">
            <CalendarDays className="text-muted-foreground size-6" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <p className="text-lg font-semibold tracking-tight">{emptyLabel}</p>
            <p className="text-muted-foreground mx-auto max-w-xs text-sm">{emptyHint}</p>
          </div>
          {canEdit && (
            <Button className="mt-2 rounded-full" onClick={onImport} disabled={importing}>
              {importing ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <ArrowUpFromLine aria-hidden="true" />
              )}
              Importar {unit}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const updatedAt = new Date(Math.max(...rows.map((row) => new Date(row.updatedAt).getTime())));

  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card px-5 py-4">
      <button
        type="button"
        onClick={onEdit}
        className="min-w-0 flex-1 cursor-pointer rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {rows.length} {rows.length === 1 ? unit : `${unit}s`}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          atualizado em {updatedAt.toLocaleDateString("pt-BR")}
        </p>
      </button>
      {canEdit && (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onEdit}
            aria-label={`Editar ${title}`}
          >
            <Pencil />
          </Button>
        </div>
      )}
    </div>
  );
}

function CatalogEditor({
  draft,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  draft: CatalogDraft;
  saving: boolean;
  onChange: (draft: CatalogDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const isSongs = draft.kind === "songs";
  const title = isSongs ? "Editar cánticos" : "Editar discursos públicos";
  const unit = isSongs ? "cántico" : "discurso";

  function updateItem(index: number, item: CatalogItem) {
    const next = structuredClone(draft);
    next.items[index] = item;
    onChange(next);
  }

  function removeItem(index: number) {
    const next = structuredClone(draft);
    next.items.splice(index, 1);
    onChange(next);
  }

  function addItem() {
    const next = structuredClone(draft);
    const nextNumber = next.items.reduce((max, item) => Math.max(max, item.number), 0) + 1;
    next.items.push({ number: nextNumber, theme: "" });
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
              {title}
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
                Lista · {draft.items.length} {draft.items.length === 1 ? unit : `${unit}s`}
              </h3>
              <div className="space-y-3">
                {draft.items.map((item, index) => (
                  <div
                    key={`${item.number}-${index}`}
                    className="flex items-center gap-2.5 rounded-xl border p-3 sm:gap-3 sm:p-3.5"
                  >
                    <Input
                      className="w-20 shrink-0 tabular-nums"
                      inputMode="numeric"
                      value={item.number || ""}
                      onChange={(event) =>
                        updateItem(index, {
                          ...item,
                          number: Number(event.target.value.replace(/\D/g, "")),
                        })
                      }
                      aria-label="Número"
                    />
                    <Input
                      className="min-w-0 flex-1"
                      value={item.theme}
                      onChange={(event) =>
                        updateItem(index, { ...item, theme: event.target.value })
                      }
                      aria-label="Tema"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="text-destructive shrink-0 rounded-full hover:text-destructive"
                      onClick={() => removeItem(index)}
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
                onClick={addItem}
              >
                <Plus aria-hidden="true" />
                Adicionar {unit}
              </Button>
            </section>
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

function WatchtowerEditor({
  draft,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  draft: WatchtowerDraft;
  saving: boolean;
  onChange: (draft: WatchtowerDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const articleColors = [
    ...new Set(
      draft.articles.map((article) => article.color).filter((c): c is string => Boolean(c)),
    ),
  ];

  function updateArticle(articleIndex: number, article: WatchtowerArticle) {
    const next = structuredClone(draft);
    next.articles[articleIndex] = article;
    onChange(next);
  }

  function removeArticle(articleIndex: number) {
    const next = structuredClone(draft);
    next.articles.splice(articleIndex, 1);
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
              Editar Sentinela
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
                Artigos de estudo · {draft.articles.length}
              </h3>
              <div className="space-y-3">
                {draft.articles.map((article, articleIndex) => (
                  <WatchtowerArticleCard
                    key={article.title || `article-${articleIndex}`}
                    article={article}
                    colorOptions={articleColors}
                    onChange={(nextArticle) => updateArticle(articleIndex, nextArticle)}
                    onRemove={() => removeArticle(articleIndex)}
                  />
                ))}
              </div>
            </section>
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

function WatchtowerArticleCard({
  article,
  colorOptions,
  onChange,
  onRemove,
}: {
  article: WatchtowerArticle;
  colorOptions: string[];
  onChange: (article: WatchtowerArticle) => void;
  onRemove: () => void;
}) {
  const songInput = (value: number | undefined, set: (song: number | undefined) => void) => (
    <Input
      inputMode="numeric"
      value={value ?? ""}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "");
        set(digits ? Number(digits) : undefined);
      }}
    />
  );

  return (
    <details className="group overflow-hidden rounded-xl border bg-card" open>
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <span
          className="size-3.5 shrink-0 rounded-full ring-1 ring-black/10"
          style={{ backgroundColor: article.color ?? "#D2D2D7" }}
          aria-hidden="true"
        />
        <ChevronDown
          className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{article.title || "Artigo"}</p>
          <p className="text-muted-foreground truncate text-xs">{article.dates ?? "Sem datas"}</p>
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
          aria-label="Remover artigo"
        >
          <Trash2 />
        </Button>
      </summary>

      <div className="space-y-5 border-t px-4 py-4 sm:px-5 sm:py-5">
        <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
          <Field label="Título" className="sm:col-span-2">
            <Input
              value={article.title}
              onChange={(event) => onChange({ ...article, title: event.target.value })}
            />
          </Field>
          <Field label="Cor">
            <div className="flex items-center gap-2">
              {colorOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onChange({ ...article, color })}
                      className={cn(
                        "size-7 rounded-full ring-1 ring-black/10 transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        article.color === color && "scale-110 ring-2 ring-ring",
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`Usar cor ${color}`}
                    />
                  ))}
                </div>
              )}
              <Input
                className="w-24"
                value={article.color ?? ""}
                onChange={(event) => onChange({ ...article, color: event.target.value })}
                aria-label="Cor personalizada (hex)"
              />
            </div>
          </Field>
          <Field label="Datas">
            <Input
              value={article.dates ?? ""}
              onChange={(event) => onChange({ ...article, dates: event.target.value })}
            />
          </Field>
          <Field label="Cántico inicial">
            {songInput(article.openingSong, (song) => onChange({ ...article, openingSong: song }))}
          </Field>
          <Field label="Cántico final">
            {songInput(article.closingSong, (song) => onChange({ ...article, closingSong: song }))}
          </Field>
        </div>
      </div>
    </details>
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
