import { describe, expect, it } from "bun:test";
import type { WorkbookWeek } from "@/features/meetings/lib/jwpub";
import { buildMidweekMeeting, buildWeekendMeeting } from "@/features/meetings/lib/meeting-builder";
import {
  effectiveScheduleDays,
  type MeetingSpecialEvent,
  resolveSpecialEventForWeek,
  specialEventCoversWeek,
  specialEventPeriodLabel,
} from "@/features/meetings/lib/special-events";

function makeEvent(overrides: Partial<MeetingSpecialEvent> = {}): MeetingSpecialEvent {
  return {
    id: "ev1",
    kind: "CONVENTION",
    behavior: "hideMeetings",
    title: "Congresso",
    theme: null,
    location: "Arena Central",
    startDateIso: "2026-08-21",
    endDateIso: "2026-08-23",
    time: null,
    travelerName: null,
    serviceTalkTheme: null,
    publicTalkTheme: null,
    finalTalkTheme: null,
    ...overrides,
  };
}

const coVisitEvent = makeEvent({
  id: "ev-co",
  kind: "CIRCUIT_OVERSEER_VISIT",
  behavior: "circuitOverseerVisit",
  title: "Visita do Superintendente de Circuito",
  startDateIso: "2026-08-17",
  endDateIso: "2026-08-23",
  travelerName: "Carlos Mendes",
  serviceTalkTheme: "A fé que nos sustenta",
  publicTalkTheme: "Deus se importa com você?",
  finalTalkTheme: "Mantenham a esperança viva",
});

describe("specialEventCoversWeek", () => {
  it("cobre semana contendo a data do evento", () => {
    expect(specialEventCoversWeek(makeEvent(), "2026-08-17")).toBe(true);
  });

  it("não cobre semana distante", () => {
    expect(specialEventCoversWeek(makeEvent(), "2026-09-07")).toBe(false);
  });

  it("visita de vários dias cobre todas as semanas sobrepostas", () => {
    const visit = makeEvent({
      kind: "CIRCUIT_OVERSEER_VISIT",
      behavior: "circuitOverseerVisit",
      startDateIso: "2026-08-19",
      endDateIso: "2026-08-30",
    });
    expect(specialEventCoversWeek(visit, "2026-08-17")).toBe(true);
    expect(specialEventCoversWeek(visit, "2026-08-24")).toBe(true);
    expect(specialEventCoversWeek(visit, "2026-08-31")).toBe(false);
  });
});

describe("resolveSpecialEventForWeek", () => {
  it("retorna null sem eventos na semana", () => {
    expect(resolveSpecialEventForWeek([makeEvent()], "2026-09-07")).toBeNull();
  });

  it("ocultar reuniões tem prioridade sobre a visita", () => {
    const resolved = resolveSpecialEventForWeek(
      [coVisitEvent, makeEvent({ startDateIso: "2026-08-22" })],
      "2026-08-17",
    );
    expect(resolved?.behavior).toBe("hideMeetings");
  });

  it("resolve a visita quando é o único evento", () => {
    const resolved = resolveSpecialEventForWeek([coVisitEvent], "2026-08-17");
    expect(resolved?.kind).toBe("CIRCUIT_OVERSEER_VISIT");
  });
});

describe("specialEventPeriodLabel", () => {
  it("um único dia", () => {
    expect(specialEventPeriodLabel(makeEvent({ endDateIso: "2026-08-21" }))).toBe("21/08/2026");
  });

  it("intervalo de dias", () => {
    expect(specialEventPeriodLabel(coVisitEvent)).toBe("17/08/2026 – 23/08/2026");
  });
});

describe("effectiveScheduleDays", () => {
  const schedule = { midweekDay: "THURSDAY" as const, weekendDay: "SUNDAY" as const };

  it("mantém os dias configurados fora da visita", () => {
    expect(effectiveScheduleDays(schedule, makeEvent())).toEqual(schedule);
    expect(effectiveScheduleDays(schedule, null)).toEqual(schedule);
  });

  it("visita move o meio de semana para terça-feira", () => {
    expect(effectiveScheduleDays(schedule, coVisitEvent)).toEqual({
      midweekDay: "TUESDAY",
      weekendDay: "SUNDAY",
    });
  });
});

const baseWeek: WorkbookWeek = {
  week: "17 a 23 de agosto de 2026",
  BibleReading: "",
  meeting: {
    openingSong: "Canción 10",
    closingSong: "Canción 20",
    "TREASURES FROM GODS WORD": [
      { number: 1, title: "Tesouros espirituais", duration: "(10 mins.)" },
      { number: 2, title: "Joias espirituais", duration: "(10 mins.)" },
      { number: 3, title: "Leitura da Bíblia", duration: "(4 mins.)" },
    ],
    "APPLY YOURSELF TO THE FIELD MINISTRY": [
      { number: 4, title: "Iniciemos conversaciones", duration: "(2 mins.)" },
    ],
    "LIVING AS CHRISTIANS": [
      { number: 7, title: "Necesidades locales", duration: "(10 mins.)" },
      { number: 8, title: "Estudio bíblico de la congregación", duration: "(30 mins.)" },
    ],
  },
};

describe("buildMidweekMeeting com visita do superintendente", () => {
  const sections = buildMidweekMeeting(
    { week: baseWeek, startTime: "19:30", songs: [], middleSong: null },
    { specialEvent: coVisitEvent },
  );
  const living = sections.find((section) => section.id === "living");

  it("substitui o estudo bíblico pelo discurso de serviço designado ao viajante", () => {
    const talk = living?.parts.find((part) => part.title === "Discurso de Serviço");
    expect(talk).toBeDefined();
    expect(talk?.duration).toBe(30);
    expect(talk?.slots).toHaveLength(1);
    expect(talk?.slots[0].label).toBe("Orador (Viajante)");
    expect(talk?.slots[0].kind).toBe("discursoServicoVisita");
    expect(talk?.subtitle).toContain("A fé que nos sustenta");
  });

  it("não solicita dirigente nem leitor", () => {
    const study = living?.parts.find((part) => part.id === "living-study");
    expect(study?.slots.some((slot) => slot.label === "Dirigente")).toBeFalsy();
    expect(study?.slots.some((slot) => slot.label === "Leitor")).toBeFalsy();
  });

  it("sem evento, mantém o estudo bíblico normal", () => {
    const sections = buildMidweekMeeting({
      week: baseWeek,
      startTime: "19:30",
      songs: [],
      middleSong: null,
    });
    const study = sections
      .find((section) => section.id === "living")
      ?.parts.find((part) => part.id === "living-study");
    expect(study?.title).toContain("Estudio bíblico");
    expect(study?.slots).toHaveLength(2);
  });
});

describe("buildWeekendMeeting com visita do superintendente", () => {
  const options = { specialEvent: coVisitEvent };
  const sections = buildWeekendMeeting(
    {
      startTime: "09:30",
      songs: [],
      talks: [{ number: 1, theme: "Tema" }],
      articles: [],
      selections: {
        openingSong: null,
        middleSong: null,
        closingSong: null,
        talk: 1,
        articleId: null,
      },
    },
    options,
  );

  it("substitui o discurso público padrão, designado ao viajante", () => {
    const talk = sections
      .flatMap((section) => section.parts)
      .find((part) => part.id === "weekend-talk");
    expect(talk?.title).toBe("Deus se importa com você?");
    expect(talk?.subtitle).toContain("Carlos Mendes");
    expect(talk?.select).toBeUndefined();
    expect(talk?.slots).toHaveLength(1);
    expect(talk?.slots[0].label).toBe("Orador (Viajante)");
    expect(talk?.slots[0].kind).toBe("discursoPublicoVisita");
  });

  it("reduz o estudo de A Sentinela para 30 minutos apenas com dirigente", () => {
    const study = sections
      .flatMap((section) => section.parts)
      .find((part) => part.id === "weekend-watchtower");
    expect(study?.duration).toBe(30);
    expect(study?.slots).toHaveLength(1);
    expect(study?.slots[0].label).toBe("Dirigente");
  });

  it("adiciona o discurso final da visita designado ao viajante", () => {
    const parts = sections.flatMap((section) => section.parts);
    const studyIndex = parts.findIndex((part) => part.id === "weekend-watchtower");
    const finalTalk = parts[studyIndex + 1];
    expect(finalTalk?.id).toBe("weekend-final-talk");
    expect(finalTalk?.title).toBe("Mantenham a esperança viva");
    expect(finalTalk?.duration).toBe(30);
    expect(finalTalk?.slots).toHaveLength(1);
    expect(finalTalk?.slots[0].label).toBe("Orador (Viajante)");
    expect(finalTalk?.slots[0].kind).toBe("discursoFinalVisita");
  });

  it("sem evento, mantém discurso público e leitor da Sentinela", () => {
    const sections = buildWeekendMeeting({
      startTime: "09:30",
      songs: [],
      talks: [{ number: 1, theme: "Tema" }],
      articles: [],
      selections: {
        openingSong: null,
        middleSong: null,
        closingSong: null,
        talk: 1,
        articleId: null,
      },
    });
    const parts = sections.flatMap((section) => section.parts);
    const talk = parts.find((part) => part.id === "weekend-talk");
    expect(talk?.title).toBe("Discurso Público");
    expect(talk?.select).toBeDefined();
    const study = parts.find((part) => part.id === "weekend-watchtower");
    expect(study?.duration).toBe(60);
    expect(study?.slots).toHaveLength(2);
    expect(parts.some((part) => part.id === "weekend-final-talk")).toBe(false);
  });
});
