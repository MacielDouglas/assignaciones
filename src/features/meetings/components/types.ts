import type { WatchtowerArticle, WorkbookContent } from "@/features/meetings/lib/jwpub";

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

export interface CatalogItem {
  number: number;
  theme: string;
}

export type TabKey = "workbook" | "watchtower" | "songs" | "talks";

export interface EditorDraft {
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

export interface WatchtowerDraft {
  symbol: string;
  name: string;
  languageCode?: string;
  articles: WatchtowerArticle[];
}

export interface PendingImport {
  kind: "workbook";
  draft: EditorDraft;
}

export interface PendingWatchtowerImport {
  kind: "watchtower";
  draft: WatchtowerDraft;
}

export interface PendingCatalogImport {
  kind: "songs" | "talks";
  symbol: string;
  name: string;
  items: CatalogItem[];
}

export interface CatalogDraft {
  kind: "songs" | "talks";
  symbol: string;
  name: string;
  items: CatalogItem[];
}

export const SECTION_LABELS: Record<string, string> = {
  "TREASURES FROM GODS WORD": "Tesoros de la Biblia",
  "APPLY YOURSELF TO THE FIELD MINISTRY": "Seamos mejores maestros",
  "LIVING AS CHRISTIANS": "Nuestra vida cristiana",
};
