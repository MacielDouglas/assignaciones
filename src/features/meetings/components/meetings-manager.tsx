"use client";

import { AlertTriangle, FileUp, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WorkbookLanguage } from "@/features/meetings/lib/workbook-meta";
import { workbookIssueKey } from "@/features/meetings/lib/workbook-meta";
import { ApiError, apiFetch, getErrorMessage } from "@/lib/api-client";
import { CatalogEditor } from "./catalog-editor";
import { CatalogList, ContentList } from "./content-list";
import { MeetingsEditor } from "./meetings-editor";
import type {
  CatalogDraft,
  CatalogItem,
  CatalogRow,
  EditorDraft,
  MeetingWorkbookRow,
  PendingCatalogImport,
  PendingImport,
  PendingWatchtowerImport,
  TabKey,
  WatchtowerDraft,
  WatchtowerRow,
} from "./types";
import { WatchtowerEditor } from "./watchtower-editor";

type PendingDelete =
  | { kind: "workbook"; row: MeetingWorkbookRow }
  | { kind: "watchtower"; row: WatchtowerRow }
  | null;

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
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
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
      form.append("kind", tab);
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
    setPendingDelete({ kind: "workbook", row });
  }

  async function performDelete() {
    if (!pendingDelete) return;
    const { kind, row } = pendingDelete;
    setPendingDelete(null);
    setDeletingId(row.id);
    try {
      const endpoint =
        kind === "workbook"
          ? `/api/organizations/${organizationId}/meetings/${row.id}`
          : `/api/organizations/${organizationId}/watchtowers/${row.id}`;
      await apiFetch(endpoint, { method: "DELETE" });
      if (kind === "workbook") {
        setWorkbooks((prev) => prev.filter((item) => item.id !== row.id));
        toast.success("Apostila excluída.");
      } else {
        setWatchtowers((prev) => prev.filter((item) => item.id !== row.id));
        toast.success("Sentinela excluída.");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  function handleDeleteWatchtower(row: WatchtowerRow) {
    setPendingDelete({ kind: "watchtower", row });
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

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              Excluir {pendingDelete?.kind === "workbook" ? "a apostila" : "a Sentinela"} "
              {pendingDelete?.row.name}"?
            </DialogTitle>
            <DialogDescription>
              {pendingDelete?.kind === "workbook"
                ? "A apostila será removida e não poderá mais ser usada nas programações existentes. Esta ação não pode ser desfeita."
                : "A Sentinela será removida e não poderá mais ser usada nas programações existentes. Esta ação não pode ser desfeita."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={!pendingDelete} onClick={performDelete}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
