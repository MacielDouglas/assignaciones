import { ChevronDown, Loader2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { WatchtowerArticle } from "@/features/meetings/lib/jwpub";
import { cn } from "@/lib/utils";
import { Field } from "./field";
import type { WatchtowerDraft } from "./types";

export function WatchtowerEditor({
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
                    // biome-ignore lint/suspicious/noArrayIndexKey: editable list, items never reorder
                    key={`article-${articleIndex}`}
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
