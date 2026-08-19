export type WorkbookLanguage = "pt" | "es" | "other";

export type WorkbookKind = "workbook" | "watchtower";

export function workbookKind(symbol: string): WorkbookKind {
  return /^w\d/i.test(symbol) && !/^mwb/i.test(symbol) ? "watchtower" : "workbook";
}

export function workbookLanguage(symbol: string): WorkbookLanguage {
  const suffix = symbol
    .slice(symbol.lastIndexOf("-") + 1)
    .trim()
    .toUpperCase();
  if (suffix === "S") return "es";
  if (suffix === "T" || suffix === "P") return "pt";
  return "other";
}

export function workbookIssueKey(symbol: string): number {
  const m = symbol.match(/(?:mwb|w)(\d{2})\.(\d{2})/i);
  if (!m) return 0;
  const year = 2000 + Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return 0;
  return year * 12 + month;
}

const MONTHS: Record<WorkbookLanguage, string[]> = {
  es: [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ],
  pt: [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ],
  other: [],
};

export function workbookMonthRange(name: string, symbol?: string): string {
  const m = name.match(/\(([^()]*?)\)/);
  if (m) {
    const inner = m[1].trim();
    const months = inner.replace(/\s*\d{4}\s*$/, "").trim();
    if (!months || /[0-9]/.test(months) || !months.includes("-")) return "";
    return months
      .split("-")
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" - ");
  }
  if (symbol && workbookKind(symbol) === "watchtower") {
    const issue = symbol.match(/(\d{2})\.(\d{2})/i);
    if (!issue) return "";
    const month = MONTHS[workbookLanguage(symbol)]?.[Number(issue[2]) - 1];
    if (!month) return "";
    return `${month} ${2000 + Number(issue[1])}`;
  }
  return "";
}
