import type { WorkbookContent, WorkbookPart, WorkbookWeek } from "@/features/meetings/lib/jwpub";
import type { WeekDay } from "@/generated/prisma/enums";

const DAY_LABELS: Record<WeekDay, string> = {
  MONDAY: "Segunda",
  TUESDAY: "Terça",
  WEDNESDAY: "Quarta",
  THURSDAY: "Quinta",
  FRIDAY: "Sexta",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

export function weekdayLabel(day: WeekDay | null): string | null {
  return day ? DAY_LABELS[day] : null;
}

export interface SongItem {
  number: number;
  theme: string;
}

export interface TalkItem {
  number: number;
  theme: string;
}

export interface WatchtowerArticleItem {
  id: string;
  title: string;
  dates: string | null;
  openingSong?: number | null;
  closingSong?: number | null;
}

export interface SchedulePerson {
  id: string;
  nome: string;
  ativo: boolean;
  estudante: boolean;
  batizado: boolean;
  sexo: string;
  familiaId: string;
  privilegiosServico: boolean;
  anciao: boolean;
  oQueVoceDiria: boolean;
  presidenteNossaVida: boolean;
  discursoTesouros: boolean;
  joiasEspirituais: boolean;
  leituraBiblia: boolean;
  partesNossaVidaCrista: boolean;
  estudoBiblicoCongregacao: boolean;
  leitorEstudoBiblico: boolean;
  oracao: boolean;
  presidenteReuniaoPublica: boolean;
  discursoPublico: boolean;
  dirigenteEstudoSentinela: boolean;
  leitorEstudoSentinela: boolean;
}

export type AssignmentKind =
  | "presidente"
  | "discursoTesouros"
  | "joiasEspirituais"
  | "leituraBiblia"
  | "discursoMinisterio"
  | "estudanteIniciando"
  | "ajudanteIniciando"
  | "estudanteCultivando"
  | "ajudanteCultivando"
  | "estudanteFazendo"
  | "ajudanteFazendo"
  | "oQueVoceDiria"
  | "estudanteExplicandoDiscurso"
  | "estudanteExplicandoDemonstracao"
  | "ajudanteExplicandoDemonstracao"
  | "partesNossaVidaCrista"
  | "necessidadesLocais"
  | "dirigenteEstudoBiblico"
  | "leitorEstudoBiblico"
  | "oracao"
  | "presidenteReuniaoPublica"
  | "discursoPublico"
  | "dirigenteSentinela"
  | "leitorSentinela";

export type SectionAccent = "neutral" | "treasures" | "ministry" | "living";

export interface AssignmentSlot {
  id: string;
  label: string;
  kind: AssignmentKind;
}

export interface SelectControl {
  kind: "song" | "talk" | "article";
  value: string;
  options: { value: string; label: string }[];
}

export interface MeetingPart {
  id: string;
  time: string | null;
  duration: number;
  title: string;
  subtitle?: string;
  song?: { number: number; theme?: string } | null;
  select?: SelectControl;
  slots: AssignmentSlot[];
}

export interface MeetingSection {
  id: string;
  title: string;
  subtitle?: string;
  accent: SectionAccent;
  parts: MeetingPart[];
}

const MONTH_NUMBERS: Record<string, number> = {
  enero: 1,
  janeiro: 1,
  febrero: 2,
  fevereiro: 2,
  marzo: 3,
  marco: 3,
  abril: 4,
  mayo: 5,
  maio: 5,
  junio: 6,
  junho: 6,
  julio: 7,
  julho: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  setembro: 9,
  octubre: 10,
  outubro: 10,
  noviembre: 11,
  novembro: 11,
  diciembre: 12,
  dezembro: 12,
};

function monthNumber(name: string): number | undefined {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return MONTH_NUMBERS[normalized];
}

export function parseIsoDay(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export function weekStartUtc(date: Date): Date {
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return addDaysUtc(monday, -((monday.getUTCDay() + 6) % 7));
}

export function formatDateBR(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

export function parseDurationMinutes(duration?: string | null): number {
  if (!duration) return 0;
  const match = duration.match(/\((\d+)\s*mins?\.?\)/i) ?? duration.match(/(\d+)\s*mins?/i);
  return match ? Number(match[1]) : 0;
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(mins)) return time;
  const total = hours * 60 + mins + minutes;
  const nextHours = Math.floor(total / 60) % 24;
  const nextMinutes = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

export function parseSongNumber(value?: string | null): number | null {
  const match = value?.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function issueYear(symbol: string | undefined): number | null {
  const match = symbol?.match(/(?:mwb|w)(\d{2})\.(\d{2})/i);
  if (!match) return null;
  const year = 2000 + Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return year;
}

interface ParsedDateRange {
  day: number;
  month: number;
  year: number;
}

function parseDateRange(text: string, yearHint?: string): ParsedDateRange | null {
  const match = text.match(
    /(\d{1,2})(?:\s*[-–]\s*\d{1,2})?\s+de\s+([a-záéíóúñ]+)(?:\s+de\s+(\d{4}))?/i,
  );
  if (!match) return null;
  const month = monthNumber(match[2]);
  if (!month) return null;
  const year = match[3] ? Number(match[3]) : null;
  if (year) return { day: Number(match[1]), month, year };
  const hintYear = yearHint ? issueYear(yearHint) : null;
  if (!hintYear) return null;
  const anchor = Date.UTC(hintYear, Number(yearHint?.match(/(\d{2})\.(\d{2})/i)?.[2] ?? 1) - 1, 1);
  let bestYear = hintYear - 1;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of [hintYear - 1, hintYear, hintYear + 1]) {
    const candidateDate = Date.UTC(candidate, month - 1, Number(match[1]));
    const distance = Math.abs(candidateDate - anchor);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestYear = candidate;
    }
  }
  return { day: Number(match[1]), month, year: bestYear };
}

export function workbookWeekDate(weekTitle: string, symbol: string): Date | null {
  const range = parseDateRange(weekTitle, symbol);
  if (!range) return null;
  return new Date(Date.UTC(range.year, range.month - 1, range.day));
}

export function findWorkbookWeek(
  content: WorkbookContent,
  symbol: string,
  weekStartIso: string,
): WorkbookWeek | null {
  const target = weekStartUtc(parseIsoDay(weekStartIso)).getTime();
  for (const week of content.weeks) {
    const date = workbookWeekDate(week.week, symbol);
    if (date && weekStartUtc(date).getTime() === target) return week;
  }
  return null;
}

export function articleStartDate(dates: string | null, symbol?: string): Date | null {
  if (!dates) return null;
  const range = parseDateRange(dates, symbol);
  if (!range) return null;
  return new Date(Date.UTC(range.year, range.month - 1, range.day));
}

export function listWorkbookWeeks(
  content: WorkbookContent,
  symbol: string,
): { title: string; date: string }[] {
  return content.weeks
    .map((week) => {
      const date = workbookWeekDate(week.week, symbol);
      return date ? { title: week.week, date: isoDay(date) } : null;
    })
    .filter((item): item is { title: string; date: string } => item !== null);
}

function songSelectOptions(songs: SongItem[]): SelectControl["options"] {
  return songs.map((song) => ({
    value: String(song.number),
    label: `Cântico ${song.number} — ${song.theme}`,
  }));
}

function songTheme(songs: SongItem[], number: number | null): string | undefined {
  if (number === null) return undefined;
  return songs.find((song) => song.number === number)?.theme;
}

function minutesLabel(minutes: number): string {
  return `${minutes} min`;
}

function sectionTotal(parts: MeetingPart[]): string | undefined {
  const total = parts.reduce((sum, part) => sum + part.duration, 0);
  return total > 0 ? `Total: ${minutesLabel(total)}` : undefined;
}

export type MinistryPartType =
  | "iniciando"
  | "cultivando"
  | "fazendo"
  | "oQueVoceDiria"
  | "explicando"
  | "discurso";

/**
 * Classifica uma parte de "Faça Seu Melhor no Ministério" pelo título
 * (as apostilas são importadas em espanhol ou português; cobre gerúndio e
 * imperativo/subjuntivo dos títulos).
 */
export function classifyMinistryPart(part: WorkbookPart): MinistryPartType {
  const haystack = `${part.title} ${part.assignment ?? ""}`;
  if (/inici\w*\s+conversa/i.test(haystack)) return "iniciando";
  if (/cultiv\w*\s+((el|o)\s+)?inter[eé](ss|s)e?\b/i.test(haystack)) {
    return "cultivando";
  }
  if (/(haciendo|hagamos|fazendo)\s+disc/i.test(haystack)) return "fazendo";
  if (/qu[eé]\s+dir[ií]a[sx]?|o\s+que\s+voc[êe]\s+diria/i.test(haystack)) return "oQueVoceDiria";
  if (/expli[cq]\w*\s+((lo\s+que)|(suas))\s+cre/i.test(haystack)) {
    return "explicando";
  }
  return "discurso";
}

/** Detecta se a parte "Explicando Suas Crenças" é discurso ou demonstração. */
export function isMinistryDemonstration(part: WorkbookPart): boolean {
  const haystack = `${part.title} ${part.assignment ?? ""} ${part.format ?? ""}`;
  // Discurso tem precedência: quando o texto cita discurso, não é demonstração.
  if (/\bdiscurso\b/i.test(haystack)) return false;
  return /demonstra|demuestre|conversaci[oó]n|conversa\b/i.test(haystack);
}

interface MinistrySlotKinds {
  studentKind: AssignmentKind;
  helperKind?: AssignmentKind;
  slotLabel: string;
}

function ministrySlotKinds(type: MinistryPartType, demonstration: boolean): MinistrySlotKinds {
  switch (type) {
    case "iniciando":
      return {
        studentKind: "estudanteIniciando",
        helperKind: "ajudanteIniciando",
        slotLabel: "Estudante",
      };
    case "cultivando":
      return {
        studentKind: "estudanteCultivando",
        helperKind: "ajudanteCultivando",
        slotLabel: "Estudante",
      };
    case "fazendo":
      return {
        studentKind: "estudanteFazendo",
        helperKind: "ajudanteFazendo",
        slotLabel: "Estudante",
      };
    case "oQueVoceDiria":
      return { studentKind: "oQueVoceDiria", slotLabel: "Designado" };
    case "explicando":
      return demonstration
        ? {
            studentKind: "estudanteExplicandoDemonstracao",
            helperKind: "ajudanteExplicandoDemonstracao",
            slotLabel: "Estudante",
          }
        : { studentKind: "estudanteExplicandoDiscurso", slotLabel: "Designado" };
    default:
      return { studentKind: "discursoMinisterio", slotLabel: "Designado" };
  }
}

export interface MidweekMeetingInput {
  week: WorkbookWeek;
  startTime: string;
  songs: SongItem[];
  middleSong: number | null;
}

export function buildMidweekMeeting(input: MidweekMeetingInput): MeetingSection[] {
  const { week, startTime, songs, middleSong } = input;
  const meeting = week.meeting;
  const treasures = meeting["TREASURES FROM GODS WORD"] ?? [];
  const ministry = meeting["APPLY YOURSELF TO THE FIELD MINISTRY"] ?? [];
  const living = meeting["LIVING AS CHRISTIANS"] ?? [];

  const discourse = treasures.find((part) => part.number === 1) ?? treasures[0];
  const jewels = treasures.find((part) => part.number === 2) ?? treasures[1];
  const reading = treasures.find((part) => part.number === 3) ?? treasures[2];
  const bibleStudy =
    living.find((part) => /estudio b[ií]blico|estudo b[ií]blico/i.test(part.title)) ??
    living[living.length - 1];
  const livingParts = living.filter((part) => part !== bibleStudy);

  const partDuration = (part: WorkbookPart | undefined): number =>
    parseDurationMinutes(part?.duration);

  const openingNumber = parseSongNumber(meeting.openingSong);
  const closingNumber = parseSongNumber(meeting.closingSong);

  let clock = startTime;

  const initialParts: MeetingPart[] = [
    {
      id: "initial-president",
      time: null,
      duration: 0,
      title: "Presidente",
      slots: [{ id: "initial-president-slot", label: "Presidente", kind: "presidente" }],
    },
  ];

  initialParts.push({
    id: "initial-opening-song",
    time: clock,
    duration: 5,
    title: "Cântico inicial",
    subtitle: meeting.openingPrayer ? "Oração inicial" : undefined,
    song: { number: openingNumber ?? 0, theme: songTheme(songs, openingNumber) },
    slots: [],
  });
  clock = addMinutesToTime(clock, 5);

  initialParts.push({
    id: "initial-comments",
    time: clock,
    duration: 1,
    title: "Palavras de introdução",
    subtitle: meeting.openingComments,
    slots: [],
  });
  clock = addMinutesToTime(clock, 1);

  const treasuresParts: MeetingPart[] = [];

  if (discourse) {
    const duration = partDuration(discourse);
    treasuresParts.push({
      id: "treasures-discourse",
      time: clock,
      duration,
      title: "Discurso",
      subtitle: discourse.title,
      slots: [{ id: "treasures-discourse-slot", label: "Designado", kind: "discursoTesouros" }],
    });
    clock = addMinutesToTime(clock, duration);
  }

  if (jewels) {
    const duration = partDuration(jewels);
    treasuresParts.push({
      id: "treasures-jewels",
      time: clock,
      duration,
      title: "Joias Espirituais",
      subtitle: jewels.title,
      slots: [{ id: "treasures-jewels-slot", label: "Designado", kind: "joiasEspirituais" }],
    });
    clock = addMinutesToTime(clock, duration);
  }

  if (reading) {
    const duration = partDuration(reading) + 1;
    treasuresParts.push({
      id: "treasures-reading",
      time: clock,
      duration,
      title: "Leitura da Bíblia",
      subtitle: reading.assignment ?? reading.title,
      slots: [{ id: "treasures-reading-slot", label: "Designado", kind: "leituraBiblia" }],
    });
    clock = addMinutesToTime(clock, duration);
  }

  const ministryParts: MeetingPart[] = ministry.map((part, index) => {
    const duration = partDuration(part) + 1;
    const kinds = ministrySlotKinds(classifyMinistryPart(part), isMinistryDemonstration(part));
    const slots: AssignmentSlot[] = [
      {
        id: `ministry-${part.number ?? index}-student`,
        label: kinds.slotLabel,
        kind: kinds.studentKind,
      },
    ];
    if (kinds.helperKind) {
      slots.push({
        id: `ministry-${part.number ?? index}-helper`,
        label: "Ajudante",
        kind: kinds.helperKind,
      });
    }
    const partRow: MeetingPart = {
      id: `ministry-${part.number ?? index}`,
      time: clock,
      duration,
      title: part.title,
      subtitle: [part.territory, part.assignment].filter(Boolean).join(" · "),
      slots,
    };
    clock = addMinutesToTime(clock, duration);
    return partRow;
  });

  const livingSectionsParts: MeetingPart[] = [];

  livingSectionsParts.push({
    id: "living-middle-song",
    time: clock,
    duration: 5,
    title: "Cântico do meio",
    song: middleSong ? { number: middleSong, theme: songTheme(songs, middleSong) } : null,
    select: {
      kind: "song",
      value: middleSong ? String(middleSong) : "",
      options: songSelectOptions(songs),
    },
    slots: [],
  });
  clock = addMinutesToTime(clock, 5);

  for (const [index, part] of livingParts.entries()) {
    const duration = partDuration(part);
    const localNeeds = /necesidades\s+locales|necessidades?\s+locais/i.test(part.title);
    livingSectionsParts.push({
      id: `living-${part.number ?? index}`,
      time: clock,
      duration,
      title: part.title,
      subtitle: part.assignment,
      slots: [
        {
          id: `living-${part.number ?? index}-speaker`,
          label: "Designado",
          kind: localNeeds ? "necessidadesLocais" : "partesNossaVidaCrista",
        },
      ],
    });
    clock = addMinutesToTime(clock, duration);
  }

  if (bibleStudy) {
    const duration = partDuration(bibleStudy);
    livingSectionsParts.push({
      id: "living-study",
      time: clock,
      duration,
      title: bibleStudy.title,
      subtitle: bibleStudy.assignment,
      slots: [
        { id: "living-study-director", label: "Dirigente", kind: "dirigenteEstudoBiblico" },
        { id: "living-study-reader", label: "Leitor", kind: "leitorEstudoBiblico" },
      ],
    });
    clock = addMinutesToTime(clock, duration);
  }

  const finalParts: MeetingPart[] = [
    {
      id: "final-conclusion",
      time: clock,
      duration: 3,
      title: "Palavras de conclusão",
      subtitle: meeting.concludingComments,
      slots: [],
    },
  ];
  clock = addMinutesToTime(clock, 3);

  finalParts.push({
    id: "final-closing-song",
    time: clock,
    duration: 5,
    title: "Cântico final",
    subtitle: meeting.closingPrayer ? "Oração final" : undefined,
    song: { number: closingNumber ?? 0, theme: songTheme(songs, closingNumber) },
    slots: [{ id: "final-closing-prayer", label: "Oração", kind: "oracao" }],
  });
  clock = addMinutesToTime(clock, 5);

  return [
    {
      id: "initial",
      title: "Abertura",
      accent: "neutral",
      subtitle: sectionTotal(initialParts),
      parts: initialParts,
    },
    {
      id: "treasures",
      title: "Tesouros da Palavra de Deus",
      accent: "treasures",
      subtitle: sectionTotal(treasuresParts),
      parts: treasuresParts,
    },
    {
      id: "ministry",
      title: "Faça Seu Melhor no Ministério",
      accent: "ministry",
      subtitle: sectionTotal(ministryParts),
      parts: ministryParts,
    },
    {
      id: "living",
      title: "Nossa Vida Cristã",
      accent: "living",
      subtitle: sectionTotal(livingSectionsParts),
      parts: livingSectionsParts,
    },
    {
      id: "final",
      title: "Encerramento",
      accent: "neutral",
      subtitle: sectionTotal(finalParts),
      parts: finalParts,
    },
  ];
}

export interface WeekendMeetingInput {
  startTime: string;
  songs: SongItem[];
  talks: TalkItem[];
  articles: WatchtowerArticleItem[];
  selections: {
    openingSong: number | null;
    middleSong: number | null;
    closingSong: number | null;
    talk: number | null;
    articleId: string | null;
  };
}

export function buildWeekendMeeting(input: WeekendMeetingInput): MeetingSection[] {
  const { startTime, songs, talks, articles, selections } = input;

  const talkSelect: SelectControl = {
    kind: "talk",
    value: selections.talk ? String(selections.talk) : "",
    options: talks.map((talk) => ({
      value: String(talk.number),
      label: `Discurso ${talk.number} — ${talk.theme}`,
    })),
  };

  const articleSelect: SelectControl = {
    kind: "article",
    value: selections.articleId ?? "",
    options: articles.map((article) => ({
      value: article.id,
      label: `${article.title}${article.dates ? ` · ${article.dates}` : ""}`,
    })),
  };

  let clock = startTime;

  const initialParts: MeetingPart[] = [
    {
      id: "weekend-president",
      time: null,
      duration: 0,
      title: "Presidente",
      slots: [
        {
          id: "weekend-president-slot",
          label: "Presidente",
          kind: "presidenteReuniaoPublica",
        },
      ],
    },
  ];

  initialParts.push({
    id: "weekend-opening-song",
    time: clock,
    duration: 5,
    title: "Cântico inicial",
    subtitle: "Oração inicial",
    song: selections.openingSong
      ? { number: selections.openingSong, theme: songTheme(songs, selections.openingSong) }
      : null,
    select: {
      kind: "song",
      value: selections.openingSong ? String(selections.openingSong) : "",
      options: songSelectOptions(songs),
    },
    slots: [],
  });
  clock = addMinutesToTime(clock, 5);

  const selectedArticle = articles.find((article) => article.id === selections.articleId);

  const publicTalkParts: MeetingPart[] = [
    {
      id: "weekend-talk",
      time: clock,
      duration: 30,
      title: "Discurso Público",
      subtitle: selectedArticle ? undefined : "Selecione o discurso do catálogo.",
      song: undefined,
      select: talkSelect,
      slots: [{ id: "weekend-talk-slot", label: "Designado", kind: "discursoPublico" }],
    },
  ];
  clock = addMinutesToTime(clock, 30);

  const middleParts: MeetingPart[] = [
    {
      id: "weekend-middle-song",
      time: clock,
      duration: 5,
      title: "Cântico do meio",
      song: selections.middleSong
        ? { number: selections.middleSong, theme: songTheme(songs, selections.middleSong) }
        : null,
      select: {
        kind: "song",
        value: selections.middleSong ? String(selections.middleSong) : "",
        options: songSelectOptions(songs),
      },
      slots: [],
    },
  ];
  clock = addMinutesToTime(clock, 5);

  const watchtowerParts: MeetingPart[] = [
    {
      id: "weekend-watchtower",
      time: clock,
      duration: 60,
      title: "Estudo de A Sentinela",
      subtitle: selectedArticle
        ? `${selectedArticle.title}${selectedArticle.dates ? ` · ${selectedArticle.dates}` : ""}`
        : "Selecione o artigo de A Sentinela.",
      select: articleSelect,
      slots: [
        { id: "weekend-watchtower-director", label: "Dirigente", kind: "dirigenteSentinela" },
        { id: "weekend-watchtower-reader", label: "Leitor", kind: "leitorSentinela" },
      ],
    },
  ];
  clock = addMinutesToTime(clock, 60);

  const finalParts: MeetingPart[] = [
    {
      id: "weekend-closing-song",
      time: clock,
      duration: 5,
      title: "Cântico final",
      subtitle: "Oração final",
      song: selections.closingSong
        ? { number: selections.closingSong, theme: songTheme(songs, selections.closingSong) }
        : null,
      select: {
        kind: "song",
        value: selections.closingSong ? String(selections.closingSong) : "",
        options: songSelectOptions(songs),
      },
      slots: [{ id: "weekend-closing-prayer", label: "Oração", kind: "oracao" }],
    },
  ];

  return [
    {
      id: "weekend-initial",
      title: "Abertura",
      accent: "neutral",
      subtitle: sectionTotal(initialParts),
      parts: initialParts,
    },
    {
      id: "weekend-talk-section",
      title: "Discurso Público",
      accent: "neutral",
      subtitle: sectionTotal(publicTalkParts),
      parts: publicTalkParts,
    },
    {
      id: "weekend-middle",
      title: "Cântico do meio",
      accent: "neutral",
      subtitle: sectionTotal(middleParts),
      parts: middleParts,
    },
    {
      id: "weekend-watchtower-section",
      title: "Estudo de A Sentinela",
      accent: "neutral",
      subtitle: sectionTotal(watchtowerParts),
      parts: watchtowerParts,
    },
    {
      id: "weekend-final",
      title: "Encerramento",
      accent: "neutral",
      subtitle: sectionTotal(finalParts),
      parts: finalParts,
    },
  ];
}
