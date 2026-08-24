import { describe, expect, it } from "bun:test";
import type { MeetingPartOverrideData } from "@/features/meetings/lib/jwpub";
import type { MeetingSection } from "@/features/meetings/lib/meeting-builder";
import {
  applyOverridesAndRecalc,
  applyPartOverrides,
  mergePartOverride,
  partOverrideKey,
  recalcMeetingTimeline,
} from "@/features/meetings/lib/part-overrides";

function makeSections(): MeetingSection[] {
  return [
    {
      id: "initial",
      title: "Abertura",
      accent: "neutral",
      parts: [
        { id: "president", time: null, duration: 0, title: "Presidente", slots: [] },
        {
          id: "opening-song",
          time: "19:30",
          duration: 5,
          title: "Cântico inicial",
          song: { number: 10 },
          slots: [],
        },
        { id: "comments", time: "19:35", duration: 1, title: "Palavras de introdução", slots: [] },
      ],
    },
    {
      id: "treasures",
      title: "Tesouros",
      accent: "treasures",
      parts: [
        {
          id: "discourse",
          time: "19:36",
          duration: 10,
          title: "Discurso",
          subtitle: "Tema original",
          slots: [],
        },
        { id: "reading", time: "19:46", duration: 5, title: "Leitura da Bíblia", slots: [] },
      ],
    },
  ];
}

describe("applyPartOverrides", () => {
  it("altera título, subtítulo, duração e cântico da parte", () => {
    const sections = applyPartOverrides(makeSections(), {
      discourse: {
        title: "Tema novo",
        subtitle: "Subtítulo novo",
        durationMinutes: 15,
        songNumber: 22,
      },
    });
    const discourse = sections[1].parts[0];
    expect(discourse.title).toBe("Tema novo");
    expect(discourse.subtitle).toBe("Subtítulo novo");
    expect(discourse.duration).toBe(15);
    expect(discourse.song?.number).toBe(22);
    // Outras partes permanecem intactas.
    expect(sections[0].parts[2].title).toBe("Palavras de introdução");
  });

  it("remove o cântico quando o número é nulo ou zero", () => {
    const sections = applyPartOverrides(makeSections(), { "opening-song": { songNumber: null } }, [
      { number: 10, theme: "Tema" },
    ]);
    expect(sections[0].parts[1].song).toBeNull();
  });

  it("usa o tema do catálogo quando disponível", () => {
    const sections = applyPartOverrides(makeSections(), { discourse: { songNumber: 77 } }, [
      { number: 77, theme: "Jeová" },
    ]);
    expect(sections[1].parts[0].song?.theme).toBe("Jeová");
  });

  it("retorna as seções originais sem overrides", () => {
    const sections = makeSections();
    expect(applyPartOverrides(sections, undefined)).toBe(sections);
  });
});

describe("recalcMeetingTimeline", () => {
  it("reposiciona em cadeia a partir de um horário fixado", () => {
    const sections = recalcMeetingTimeline(makeSections(), { discourse: { startTime: "19:40" } });
    // Partes sem horário continuam sem horário.
    expect(sections[0].parts[0].time).toBeNull();
    expect(sections[0].parts[1].time).toBe("19:30");
    expect(sections[0].parts[2].time).toBe("19:35");
    // Discurso fixado em 19:40; leitura vem depois da duração dele (10 min).
    expect(sections[1].parts[0].time).toBe("19:40");
    expect(sections[1].parts[1].time).toBe("19:50");
  });

  it("mantém os horários sem overrides", () => {
    const sections = makeSections();
    const recalced = recalcMeetingTimeline(structuredClone(sections), undefined);
    expect(recalced.flatMap((section) => section.parts.map((part) => part.time))).toEqual(
      sections.flatMap((section) => section.parts.map((part) => part.time)),
    );
  });
});

describe("applyOverridesAndRecalc", () => {
  it("aplica overrides e reposiciona a timeline de uma vez", () => {
    const sections = applyOverridesAndRecalc(
      makeSections(),
      { discourse: { title: "Novo tema", startTime: "19:50", durationMinutes: 20 } },
      [{ number: 3, theme: "Tema" }],
    );
    const discourse = sections[1].parts[0];
    expect(discourse.title).toBe("Novo tema");
    expect(discourse.time).toBe("19:50");
    expect(discourse.duration).toBe(20);
    // Leitura vem depois do discurso com duração alterada.
    expect(sections[1].parts[1].time).toBe("20:10");
  });
});

describe("mergePartOverride", () => {
  it("adiciona e mescla overrides no conteúdo", () => {
    const content: { partOverrides?: Record<string, MeetingPartOverrideData> } = {};
    mergePartOverride(content, "Semana X", "discourse", { title: "Novo" });
    mergePartOverride(content, "Semana X", "discourse", { durationMinutes: 12 });
    expect(content.partOverrides?.[partOverrideKey("Semana X", "discourse")]).toEqual({
      title: "Novo",
      durationMinutes: 12,
    });
  });

  it("remove a entrada quando todos os campos ficam nulos", () => {
    const content: { partOverrides?: Record<string, MeetingPartOverrideData> } = {};
    mergePartOverride(content, "Semana X", "opening-song", { songNumber: 5 });
    mergePartOverride(content, "Semana X", "opening-song", { songNumber: null });
    expect(Object.keys(content.partOverrides ?? {})).toHaveLength(0);
  });

  it("usa chaves por semana para não vazar entre semanas", () => {
    const content: { partOverrides?: Record<string, MeetingPartOverrideData> } = {};
    mergePartOverride(content, "Semana X", "discourse", { title: "A" });
    mergePartOverride(content, "Semana Y", "discourse", { title: "B" });
    expect(Object.keys(content.partOverrides ?? {})).toHaveLength(2);
  });
});
