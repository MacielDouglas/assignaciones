import type { MeetingPartOverrideData } from "@/features/meetings/lib/jwpub";
import {
  addMinutesToTime,
  type MeetingSection,
  type SongItem,
} from "@/features/meetings/lib/meeting-builder";

/** Chave do override de uma parte dentro de `content.partOverrides`. */
export function partOverrideKey(weekTitle: string, partId: string): string {
  return `${weekTitle}::${partId}`;
}

function hasTimeline(part: { time: string | null; duration: number }): boolean {
  return part.time !== null;
}

/**
 * Aplica os overrides (título, subtítulo, duração e cântico) em seções já
 * construídas. Retorna novas estruturas; o horário é resolvido por
 * `recalcMeetingTimeline`.
 */
export function applyPartOverrides(
  sections: MeetingSection[],
  overrides: Record<string, MeetingPartOverrideData> | undefined,
  songs?: SongItem[],
): MeetingSection[] {
  if (!overrides || Object.keys(overrides).length === 0) return sections;
  const next = structuredClone(sections);
  for (const section of next) {
    for (const part of section.parts) {
      const override = overrides[part.id];
      if (!override) continue;
      if (override.title !== undefined && override.title !== null) part.title = override.title;
      if (override.subtitle !== undefined) {
        part.subtitle = override.subtitle === "" ? undefined : override.subtitle;
      }
      if (override.durationMinutes !== undefined && override.durationMinutes !== null) {
        part.duration = override.durationMinutes;
      }
      if (override.songNumber !== undefined) {
        const number = override.songNumber;
        part.song =
          number && number > 0
            ? { number, theme: songs?.find((song) => song.number === number)?.theme }
            : null;
      }
    }
  }
  return next;
}

/**
 * Reposiciona as partes em cadeia: cada parte começa no próprio override
 * de horário (quando existir) ou no fim da parte anterior. Partes sem
 * horário na origem (ex.: presidente) permanecem sem horário.
 */
export function recalcMeetingTimeline(
  sections: MeetingSection[],
  overrides: Record<string, MeetingPartOverrideData> | undefined,
): MeetingSection[] {
  const next = structuredClone(sections);
  let clock: string | null = null;
  for (const section of next) {
    for (const part of section.parts) {
      if (!hasTimeline(part)) continue;
      const pinned = overrides?.[part.id]?.startTime;
      const start = pinned ?? clock ?? part.time ?? "00:00";
      part.time = start;
      clock = addMinutesToTime(start, part.duration);
    }
  }
  return next;
}

/** Aplica overrides e recalcula os horários da reunião de uma vez. */
export function applyOverridesAndRecalc(
  sections: MeetingSection[],
  overrides: Record<string, MeetingPartOverrideData> | undefined,
  songs?: SongItem[],
): MeetingSection[] {
  return recalcMeetingTimeline(applyPartOverrides(sections, overrides, songs), overrides);
}

/**
 * Mescla um override no conteúdo da apostila (mutando a cópia recebida).
 * Entradas vazias são removidas para não acumular lixo no JSON.
 */
export function mergePartOverride(
  content: { partOverrides?: Record<string, MeetingPartOverrideData> },
  weekTitle: string,
  partId: string,
  patch: MeetingPartOverrideData,
): void {
  const key = partOverrideKey(weekTitle, partId);
  const current = content.partOverrides ?? {};
  const merged: MeetingPartOverrideData = { ...current[key], ...patch };
  // Remove chaves indefinidas/nulas-vazias: ausência de campo mantém valor anterior.
  for (const field of Object.keys(merged) as (keyof MeetingPartOverrideData)[]) {
    if (merged[field] === undefined) delete merged[field];
  }
  const isEmpty = Object.values(merged).every((value) => value === null || value === undefined);
  if (isEmpty) delete current[key];
  else current[key] = merged;
  content.partOverrides = current;
}
