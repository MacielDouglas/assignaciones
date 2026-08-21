import { ArrowUpFromLine, CalendarDays, Loader2, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkbookLanguage } from "@/features/meetings/lib/workbook-meta";
import { workbookLanguage, workbookMonthRange } from "@/features/meetings/lib/workbook-meta";
import type { CatalogRow, MeetingWorkbookRow, TabKey, WatchtowerRow } from "./types";

type ContentRow = MeetingWorkbookRow | WatchtowerRow;

export function ContentList<T extends ContentRow>({
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
          <div className="bg-primary/10 flex size-14 items-center justify-center rounded-2xl">
            <CalendarDays className="size-6" aria-hidden="true" />
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

export function CatalogList({
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
          <div className="bg-primary/10 flex size-14 items-center justify-center rounded-2xl">
            <CalendarDays className="size-6" aria-hidden="true" />
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
