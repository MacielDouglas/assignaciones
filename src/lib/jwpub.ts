import { createDecipheriv, createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { inflateSync } from "node:zlib";
import { unzipSync } from "fflate";

const XOR_KEY = Buffer.from(
  "11cbb5587e32846d4c26790c633da289f66fe5842a3a585ce1bc3a294af5ada7",
  "hex",
);

const BOOK_ABBREVIATIONS: Record<string, string> = {
  Gén: "Gén.",
  Éx: "Éx.",
  Lev: "Lev.",
  Núm: "Núm.",
  Deut: "Deut.",
  Dt: "Dt.",
  Jos: "Jos.",
  Jue: "Jue.",
  Rut: "Rut.",
  "1 Sam": "1 Sam.",
  "2 Sam": "2 Sam.",
  "1 Rey": "1 Rey.",
  "2 Rey": "2 Rey.",
  "1 Cr": "1 Cr.",
  "2 Cr": "2 Cr.",
  Esd: "Esd.",
  Neh: "Neh.",
  Est: "Est.",
  Job: "Job",
  Sal: "Sal.",
  Pr: "Pr.",
  Ecl: "Ecl.",
  Cant: "Cant.",
  Is: "Is.",
  Jer: "Jer.",
  Lam: "Lam.",
  Eze: "Eze.",
  Dan: "Dan.",
  Ose: "Ose.",
  Joel: "Joel",
  Amós: "Amós",
  Abd: "Abd.",
  Jon: "Jon.",
  Miq: "Miq.",
  Nah: "Nah.",
  Hab: "Hab.",
  Sof: "Sof.",
  Ageo: "Ageo",
  Zac: "Zac.",
  Mal: "Mal.",
  Mat: "Mat.",
  Mar: "Mar.",
  Luc: "Luc.",
  Juan: "Juan",
  Hech: "Hech.",
  Rom: "Rom.",
  "1 Cor": "1 Cor.",
  "2 Cor": "2 Cor.",
  Gál: "Gál.",
  Efe: "Efe.",
  Flp: "Flp.",
  Col: "Col.",
  "1 Tes": "1 Tes.",
  "2 Tes": "2 Tes.",
  "1 Tim": "1 Tim.",
  "2 Tim": "2 Tim.",
  Tito: "Tito",
  Filem: "Filem.",
  Heb: "Heb.",
  Sant: "Sant.",
  "1 Ped": "1 Ped.",
  "2 Ped": "2 Ped.",
  "1 Juan": "1 Juan",
  "2 Juan": "2 Juan",
  "3 Juan": "3 Juan",
  Jud: "Jud.",
  Rev: "Rev.",
  Apoc: "Apoc.",
  "1Sa": "1 Sam.",
  "2Sa": "2 Sam.",
  "1Re": "1 Rey.",
  "2Re": "2 Rey.",
  "1Cr": "1 Cr.",
  "2Cr": "2 Cr.",
  "1Co": "1 Cor.",
  "2Co": "2 Cor.",
  "1Ti": "1 Tim.",
  "2Ti": "2 Tim.",
  "1Pe": "1 Ped.",
  "2Pe": "2 Ped.",
  "1Jn": "1 Juan",
  "2Jn": "2 Juan",
  "3Jn": "3 Juan",
  Mt: "Mat.",
  Sl: "Sal.",
};

const TERRITORY_PREFIXES =
  /^(DE CASA EN CASA Y EN LA CALLE|DE CASA EN CASA|PREDICACIÓN INFORMAL|PREDICACIÓN PÚBLICA|PREDICACIÓN EN LA CALLE|EN LA CALLE|LLAMADAS TELEFÓNICAS|CARTAS Y LLAMADAS)\.\s*/;

export interface WorkbookPart {
  number?: number;
  title: string;
  duration?: string;
  content?: string | string[];
  questions?: string[];
  assignment?: string;
  territory?: string;
  format?: string;
}

export interface WorkbookWeek {
  week: string;
  BibleReading: string;
  meeting: {
    openingSong?: string;
    openingPrayer?: boolean;
    openingComments?: string;
    "TREASURES FROM GODS WORD"?: WorkbookPart[];
    "APPLY YOURSELF TO THE FIELD MINISTRY"?: WorkbookPart[];
    "LIVING AS CHRISTIANS"?: WorkbookPart[];
    concludingComments?: string;
    closingSong?: string;
    closingPrayer?: boolean;
  };
}

export interface WorkbookContent {
  name: string;
  weeks: WorkbookWeek[];
  coverInformation?: {
    coverImage?: string;
    volume?: string;
    symbol: string;
  };
  additionalInformation?: {
    week: string;
    title: string;
    duration: string;
    content?: string;
    video?: string;
  };
}

export interface ParsedWorkbook {
  symbol: string;
  name: string;
  shortTitle: string;
  displayTitle: string;
  referenceTitle: string;
  languageCode: string;
  fileName: string;
  content: WorkbookContent;
}

type PartSection =
  | "TREASURES FROM GODS WORD"
  | "APPLY YOURSELF TO THE FIELD MINISTRY"
  | "LIVING AS CHRISTIANS";

interface Event {
  pos: number;
  type: "part" | "section" | "music" | "closing";
  html: string;
  section?: PartSection;
}

const SECTION_BY_ICON: Record<string, PartSection> = {
  gem: "TREASURES FROM GODS WORD",
  wheat: "APPLY YOURSELF TO THE FIELD MINISTRY",
  sheep: "LIVING AS CHRISTIANS",
};

function normalizeText(s: string): string {
  return s
    .replace(/\u00a0/g, " ")
    .replace(/\u2009/g, " ")
    .replace(/\u2011/g, "-")
    .replace(/\u2019/g, "'")
    .replace(/\u201c/g, '"')
    .replace(/\u201d/g, '"');
}

function stripTags(html: string): string {
  return normalizeText(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<(br|hr|p|div|li|ul|h1|h2|h3|figure|figcaption|section|header)[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&hellip;/gi, "…")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDurationLine(text: string): { duration?: string; remainder: string } {
  const m = text.match(/^\((\d+)\s*mins?\.\)\s*(.*)$/s);
  if (!m) return { remainder: text };
  return { duration: `(${m[1]} mins.)`, remainder: m[2].trim() };
}

function formatRemainder(remainder: string): string | undefined {
  const t = remainder.trim();
  return t.length > 0 ? t : undefined;
}

function normalizeBibleReferences(text: string): string {
  return text.replace(
    /(^|[\s;,(])((?:1|2)?)(\s?)([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{1,4})\s+(\d+(?:[:,.\-\u2013\u2014]\s*\d+)*)/g,
    (match, prefix: string, num: string, sp: string, book: string, rest: string) => {
      const mapped = BOOK_ABBREVIATIONS[`${num}${book}`] ?? BOOK_ABBREVIATIONS[book.trim()];
      if (!mapped) return match;
      return `${prefix}${num ? "" : sp}${mapped} ${rest.replace(/\s+/g, " ").trim()}`;
    },
  );
}

function decryptDocument(content: Uint8Array, seed: string): string {
  const hash = createHash("sha256").update(seed).digest();
  const keyMaterial = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) keyMaterial[i] = hash[i] ^ XOR_KEY[i];
  const decipher = createDecipheriv(
    "aes-128-cbc",
    keyMaterial.subarray(0, 16),
    keyMaterial.subarray(16, 32),
  );
  const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);
  return inflateSync(decrypted).toString("utf8");
}

function getLanguageCodeFromFileName(fileName: string): string {
  const m = fileName.match(/_([A-Za-z0-9]{1,4})_\d{6}\.db$/);
  return m ? m[1] : "";
}

function extractEvents(body: string): Event[] {
  const events: Event[] = [];
  const h3Re = /<h3\b[^>]*>[\s\S]*?<\/h3>/g;
  const sectionRe = /<div\b[^>]*class="[^"]*dc-icon--(gem|wheat|sheep)[^"]*"[^>]*>[\s\S]*?<\/div>/g;
  let m: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
  while ((m = h3Re.exec(body)) !== null) {
    const html = m[0];
    const text = stripTags(html);
    if (/dc-icon--music/.test(html)) {
      events.push({
        pos: m.index,
        type: /Palabras de conclusión/.test(text) ? "closing" : "music",
        html,
      });
    } else {
      events.push({ pos: m.index, type: "part", html });
    }
  }
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
  while ((m = sectionRe.exec(body)) !== null) {
    events.push({
      pos: m.index,
      type: "section",
      html: m[0],
      section: SECTION_BY_ICON[m[1]],
    });
  }
  events.sort((a, b) => a.pos - b.pos);
  return events;
}

function extractPartTitle(html: string): { number?: number; title: string } {
  const text = stripTags(html);
  const m = text.match(/^(\d+)\.\s*(.*)$/s);
  if (m) return { number: Number(m[1]), title: m[2].trim() };
  return { title: text };
}

function extractSong(text: string): string | undefined {
  const m = text.match(/Canción\s*\d+/i);
  return m ? m[0] : undefined;
}

function collectBlocks(slice: string): string[] {
  const s = slice
    .replace(/<figure[\s\S]*?<\/figure>/gi, "")
    .replace(/<hr[^>]*\/?>/gi, " ")
    .replace(/<div class="gen-field"[\s\S]*?<\/div>/gi, " ")
    .replace(/<span id="page\d+"[^>]*>[\s\S]*?<\/span>/gi, " ");
  const blocks: string[] = [];
  const blockRe = /<ul\b[^>]*>[\s\S]*?<\/ul>|<p\b[^>]*>[\s\S]*?<\/p>/g;
  let m: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
  while ((m = blockRe.exec(s)) !== null) {
    if (m[0].startsWith("<ul")) {
      const lis = [...m[0].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)];
      for (const li of lis) {
        const text = stripTags(li[1]);
        if (text) blocks.push(text);
      }
    } else {
      const text = stripTags(m[0]);
      if (text) blocks.push(text);
    }
  }
  return blocks.filter((b) => b !== "Respuesta");
}

function isParaMeditar(text: string): boolean {
  return /^PARA MEDITAR:/.test(text);
}

function isVideoLine(text: string): boolean {
  return /^Pon el VIDEO/.test(text);
}

function videoTitleFromBlock(text: string): string | undefined {
  const m = text.match(/Pon el VIDEO\s+([^.]+)\./);
  return m ? m[1].trim() : undefined;
}

function mergeVideoContent(videoText: string, questions: string[]): string {
  const base = videoText.replace(/\s+Luego pregunta:\s*$/, "").replace(/\.$/, ".");
  if (questions.length === 0) return base;
  return `${base} Luego pregunta: ${questions.join(" ")}`;
}

interface ParsedWeek {
  week: WorkbookWeek;
  additional?: { content: string; video?: string };
}

function parseWeek(html: string, title: string, subtitle: string | null): ParsedWeek {
  const h2 = html.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? "";
  const bibleReading = stripTags(h2);
  const events = extractEvents(html);

  const week: WorkbookWeek = {
    week: title,
    BibleReading: bibleReading || subtitle || "",
    meeting: {},
  };

  let currentSection: PartSection | undefined;
  const partsBySection: Partial<Record<PartSection, WorkbookPart[]>> = {};
  let openingSong: string | undefined;
  let openingPrayer = false;
  let openingComments: string | undefined;
  let concludingComments: string | undefined;
  let closingSong: string | undefined;
  let closingPrayer = false;
  let additional: { content: string; video?: string } | undefined;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const next = events[i + 1];
    const slice = next
      ? html.slice(event.pos + event.html.length, next.pos)
      : html.slice(event.pos + event.html.length);

    if (event.type === "music") {
      if (i === 0) {
        const text = stripTags(event.html);
        openingSong = extractSong(text);
        openingPrayer = /y oración/.test(text);
        const commentsPart = text
          .split("|")
          .map((p) => p.trim())
          .find((p) => p.startsWith("Palabras de introducción"));
        openingComments = commentsPart?.trim();
      }
      continue;
    }

    if (event.type === "closing") {
      const text = stripTags(event.html);
      const parts = text.split("|").map((p) => p.trim());
      concludingComments = parts.find((p) => p.startsWith("Palabras de conclusión"));
      closingSong = extractSong(text);
      closingPrayer = /y oración/.test(text);
      continue;
    }

    if (event.type === "section") {
      currentSection = event.section;
      continue;
    }

    const { number, title: partTitle } = extractPartTitle(event.html);
    if (!number || !currentSection) continue;

    const blocks = collectBlocks(slice);
    const part: WorkbookPart = { number, title: partTitle };
    const { duration, remainder } = parseDurationLine(blocks[0] ?? "");
    part.duration = duration;
    const rest = blocks.slice(1);

    if (currentSection === "TREASURES FROM GODS WORD") {
      if (number === 2) {
        part.questions = blocks.filter((b) => !/^\(\d+\s*mins?\.\)/.test(b));
      } else if (number === 3) {
        part.assignment = formatRemainder(remainder);
      } else {
        const contentLines = rest
          .filter((b) => !isParaMeditar(b))
          .map((b) => {
            if (isVideoLine(b)) {
              const videoTitle = videoTitleFromBlock(b);
              return `[Pon el VIDEO${videoTitle ? ` ${videoTitle}` : ""}].`;
            }
            return b;
          });
        if (contentLines.length > 0) part.content = contentLines;
      }
    } else if (currentSection === "APPLY YOURSELF TO THE FIELD MINISTRY") {
      const t = remainder.trim();
      const m = t.match(TERRITORY_PREFIXES);
      if (m) {
        part.territory = `${m[1]}.`;
        part.assignment = formatRemainder(t.slice(m[0].length));
      } else {
        part.assignment = formatRemainder(t);
      }
      const extraParagraphs = rest.filter((b) => !/^¿/.test(b));
      if (extraParagraphs.length > 0) {
        part.assignment = [part.assignment, ...extraParagraphs].filter(Boolean).join(" ");
      }
    } else if (number === 8) {
      part.assignment = formatRemainder(remainder);
    } else {
      const fmt = remainder.match(/^(Análisis con el auditorio[^.]*\.)\s*(.*)$/s);
      if (fmt) {
        part.format = fmt[1].trim();
      } else if (remainder.trim()) {
        part.format = formatRemainder(remainder);
      }
      const videoIndex = rest.findIndex(isVideoLine);
      const beforeVideo = videoIndex === -1 ? rest : rest.slice(0, videoIndex);
      const contentParagraphs = beforeVideo.filter(
        (b) => !isVideoLine(b) && !isParaMeditar(b) && !/^¿/.test(b),
      );
      const videoLine = videoIndex === -1 ? undefined : rest[videoIndex];
      const questions = rest.filter((b) => /^¿/.test(b));
      if (contentParagraphs.length > 0) {
        additional = {
          content: contentParagraphs.join(" "),
          video: videoLine ? videoTitleFromBlock(videoLine) : undefined,
        };
      } else if (videoLine) {
        part.content = mergeVideoContent(videoLine, questions);
      }
    }

    if (!partsBySection[currentSection]) partsBySection[currentSection] = [];
    partsBySection[currentSection]?.push(part);
  }

  const meeting = week.meeting;
  if (openingSong) meeting.openingSong = openingSong;
  if (openingPrayer) meeting.openingPrayer = true;
  if (openingComments) meeting.openingComments = openingComments;
  if (partsBySection["TREASURES FROM GODS WORD"])
    meeting["TREASURES FROM GODS WORD"] = partsBySection["TREASURES FROM GODS WORD"];
  if (partsBySection["APPLY YOURSELF TO THE FIELD MINISTRY"])
    meeting["APPLY YOURSELF TO THE FIELD MINISTRY"] =
      partsBySection["APPLY YOURSELF TO THE FIELD MINISTRY"];
  if (partsBySection["LIVING AS CHRISTIANS"])
    meeting["LIVING AS CHRISTIANS"] = partsBySection["LIVING AS CHRISTIANS"];
  if (concludingComments) meeting.concludingComments = concludingComments;
  if (closingSong) meeting.closingSong = closingSong;
  if (closingPrayer) meeting.closingPrayer = true;

  return { week, additional };
}

function parseCover(html: string): { coverImage?: string } {
  const caption = html.match(/Imagen de la portada:\s*([^<]*)/)?.[1];
  if (caption?.trim()) return { coverImage: caption.trim() };
  const img = html.match(/<img[^>]*alt="([^"]*)"/)?.[1];
  return { coverImage: img?.trim() || undefined };
}

function normalizeWorkbookReferences(content: WorkbookContent): void {
  const walk = (obj: unknown): void => {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const item = obj[i];
        if (typeof item === "string") {
          obj[i] = normalizeBibleReferences(item);
        } else {
          walk(item);
        }
      }
      return;
    }
    for (const key of Object.keys(obj)) {
      const value = (obj as Record<string, unknown>)[key];
      if (typeof value === "string") {
        (obj as Record<string, unknown>)[key] = normalizeBibleReferences(value);
      } else {
        walk(value);
      }
    }
  };
  walk(content);
}

export function parseWorkbook(buffer: Uint8Array): ParsedWorkbook {
  const files = unzipSync(buffer);
  const manifestFile = files["manifest.json"];
  if (!manifestFile) throw new Error("Arquivo .jwpub inválido: manifest.json não encontrado");
  const manifest = JSON.parse(new TextDecoder().decode(manifestFile)) as {
    publication?: {
      title?: string;
      shortTitle?: string;
      displayTitle?: string;
      referenceTitle?: string;
      fileName?: string;
    };
  };
  const contentsFile = files.contents;
  if (!contentsFile) throw new Error("Arquivo .jwpub inválido: contents não encontrado");
  const innerFiles = unzipSync(contentsFile);
  const dbFile = Object.keys(innerFiles).find((f) => f.endsWith(".db"));
  if (!dbFile) throw new Error("Arquivo .jwpub inválido: banco de dados não encontrado");

  const tmpDir = mkdtempSync(join(tmpdir(), "jwpub-"));
  const dbPath = join(tmpDir, dbFile);
  writeFileSync(dbPath, innerFiles[dbFile]);
  try {
    const db = new DatabaseSync(dbPath, { readOnly: true });
    try {
      const pub = db.prepare("SELECT * FROM Publication LIMIT 1").get() as {
        MepsLanguageIndex: number;
        Symbol: string;
        Year: number;
        IssueTagNumber: number | string;
        IssueNumber: number;
      };
      const issue = db.prepare("SELECT * FROM PublicationIssueProperty LIMIT 1").get() as {
        Symbol: string;
      };
      const docs = db
        .prepare(
          "SELECT DocumentId, Title, Subtitle FROM Document WHERE DocumentId > 0 ORDER BY DocumentId",
        )
        .all() as { DocumentId: number; Title: string; Subtitle: string | null }[];
      const viewItems = db
        .prepare(
          "SELECT Title, DefaultDocumentId FROM PublicationViewItem WHERE DefaultDocumentId IS NOT NULL AND DefaultDocumentId > 0 ORDER BY DefaultDocumentId",
        )
        .all() as { Title: string; DefaultDocumentId: number }[];

      const seedList = [pub.MepsLanguageIndex, pub.Symbol, pub.Year];
      if (pub.IssueTagNumber !== 0 && pub.IssueTagNumber !== "0" && pub.IssueTagNumber !== "") {
        seedList.push(pub.IssueTagNumber);
      }
      const seed = seedList.join("_");

      const coverDoc = db.prepare("SELECT Content FROM Document WHERE DocumentId = 0").get() as
        | { Content: Uint8Array }
        | undefined;
      const coverHtml = coverDoc ? decryptDocument(coverDoc.Content, seed) : "";
      const coverInfo = parseCover(coverHtml);
      const coverH1 = coverHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1];
      const name = coverH1 ? stripTags(coverH1) : (manifest.publication?.title ?? "");

      const weeks: WorkbookWeek[] = [];
      let additionalInfo:
        | { week: string; title: string; duration: string; content?: string; video?: string }
        | undefined;

      const demoteWeek = (weekTitle: string, additional: { content: string; video?: string }) => {
        const week = weeks.find((w) => w.week === weekTitle);
        const part7 = week?.meeting["LIVING AS CHRISTIANS"]?.find((p) => p.number === 7);
        if (!part7) return;
        if (additional.video) {
          part7.content = `Pon el VIDEO ${additional.video}.`;
        } else {
          part7.content = additional.content;
        }
      };

      for (const doc of docs) {
        const row = db
          .prepare("SELECT Content FROM Document WHERE DocumentId = ?")
          .get(doc.DocumentId) as { Content: Uint8Array };
        const html = decryptDocument(row.Content, seed);
        const viewItem = viewItems.find((v) => v.DefaultDocumentId === doc.DocumentId);
        const weekTitle = viewItem?.Title ?? doc.Title;
        const { week, additional } = parseWeek(html, weekTitle, doc.Subtitle);
        weeks.push(week);
        if (additional) {
          const part7 = week.meeting["LIVING AS CHRISTIANS"]?.find((p) => p.number === 7);
          const candidate = {
            week: weekTitle,
            title: part7?.title ?? "",
            duration: part7?.duration ?? "",
            content: additional.content,
            video: additional.video,
          };
          if (
            !additionalInfo ||
            (candidate.content?.length ?? 0) > (additionalInfo.content?.length ?? 0)
          ) {
            if (additionalInfo)
              demoteWeek(additionalInfo.week, {
                content: additionalInfo.content ?? "",
                video: additionalInfo.video,
              });
            additionalInfo = candidate;
          } else {
            demoteWeek(weekTitle, additional);
          }
        }
      }

      const languageCode = getLanguageCodeFromFileName(dbFile);
      const symbol = `${issue.Symbol}-${languageCode}`;
      const content: WorkbookContent = {
        name,
        weeks,
        coverInformation: {
          coverImage: coverInfo.coverImage,
          volume: `Vol. ${pub.Year - 2015}, núm. ${pub.IssueNumber}`,
          symbol,
        },
      };
      if (additionalInfo) content.additionalInformation = additionalInfo;
      normalizeWorkbookReferences(content);

      return {
        symbol,
        name,
        shortTitle: manifest.publication?.shortTitle ?? "",
        displayTitle: manifest.publication?.displayTitle ?? "",
        referenceTitle: manifest.publication?.referenceTitle ?? "",
        languageCode,
        fileName: manifest.publication?.fileName ?? dbFile,
        content,
      };
    } finally {
      db.close();
    }
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
