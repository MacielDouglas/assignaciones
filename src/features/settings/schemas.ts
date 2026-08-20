import { z } from "zod";
import { AllowedSex, SpecialEventKind, WeekDay } from "@/generated/prisma/enums";
import { monthKeyOfIso, weekKeyOfIso } from "./lib/schedule";

export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido.");

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "Texto muito longo.")
    .transform((value) => (value === "" ? undefined : value))
    .optional();

export const meetingScheduleSchema = z
  .object({
    midweekDay: z.nativeEnum(WeekDay).nullable(),
    midweekTime: timeSchema.nullable(),
    weekendDay: z.nativeEnum(WeekDay).nullable(),
    weekendTime: timeSchema.nullable(),
  })
  .refine((data) => (data.midweekDay === null) === (data.midweekTime === null), {
    message: "Configure o dia e o horário da reunião de meio de semana juntos.",
    path: ["midweekDay"],
  })
  .refine((data) => (data.weekendDay === null) === (data.weekendTime === null), {
    message: "Configure o dia e o horário da reunião de fim de semana juntos.",
    path: ["weekendDay"],
  })
  .refine(
    (data) =>
      data.midweekDay === null || data.weekendDay === null || data.midweekDay !== data.weekendDay,
    {
      message: "As reuniões de meio de semana e de fim de semana devem ocorrer em dias diferentes.",
      path: ["weekendDay"],
    },
  );

const specialEventBaseSchema = {
  date: dateSchema,
};

export const specialEventInputSchema = z
  .discriminatedUnion("kind", [
    z.object({
      ...specialEventBaseSchema,
      kind: z.literal(SpecialEventKind.MEMORIAL),
      time: timeSchema,
      location: optionalString(120),
    }),
    z.object({
      ...specialEventBaseSchema,
      kind: z.literal(SpecialEventKind.SPECIAL_TALK),
      theme: z.string().trim().min(1, "Informe o tema.").max(200, "Tema muito longo."),
      speaker: optionalString(120),
    }),
    z.object({
      ...specialEventBaseSchema,
      kind: z.literal(SpecialEventKind.CIRCUIT_OVERSEER_VISIT),
      endDate: dateSchema,
      traveler: optionalString(120),
      serviceTalk: optionalString(200),
      publicTalk: optionalString(200),
      finalTalk: optionalString(200),
    }),
    z.object({
      ...specialEventBaseSchema,
      kind: z.literal(SpecialEventKind.CONVENTION),
      endDate: dateSchema,
      location: optionalString(120),
    }),
    z.object({
      ...specialEventBaseSchema,
      kind: z.literal(SpecialEventKind.ASSEMBLY_TRAVELING_OVERSEER),
      location: optionalString(120),
    }),
    z.object({
      ...specialEventBaseSchema,
      kind: z.literal(SpecialEventKind.ASSEMBLY_REPRESENTATIVE),
      location: optionalString(120),
    }),
  ])
  .superRefine((data, ctx) => {
    const endDate =
      data.kind === SpecialEventKind.CIRCUIT_OVERSEER_VISIT ||
      data.kind === SpecialEventKind.CONVENTION
        ? data.endDate
        : undefined;
    if (endDate !== undefined && endDate < data.date) {
      ctx.addIssue({
        code: "custom",
        message: "A data final deve ser igual ou posterior à data inicial.",
        path: ["endDate"],
      });
    }
  });

export type MeetingScheduleInput = z.infer<typeof meetingScheduleSchema>;
export type SpecialEventInput = z.infer<typeof specialEventInputSchema>;

export const cleaningSectorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do setor.")
    .max(40, "O nome deve ter no máximo 40 caracteres."),
  task: z
    .string()
    .trim()
    .min(1, "Informe a tarefa do setor.")
    .max(2000, "A tarefa deve ter no máximo 2000 caracteres."),
  peopleNeeded: z
    .number()
    .int("Quantidade inválida.")
    .min(1, "Informe ao menos 1 pessoa.")
    .max(50, "No máximo 50 pessoas."),
  allowsYouth: z.boolean(),
  allowedSex: z.nativeEnum(AllowedSex),
});

export const cleaningListSectorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do setor.")
    .max(40, "O nome deve ter no máximo 40 caracteres."),
  task: z
    .string()
    .trim()
    .min(1, "Informe a tarefa do setor.")
    .max(2000, "A tarefa deve ter no máximo 2000 caracteres."),
});

export const cleaningWeeklySchema = z
  .object({
    time: timeSchema,
    dates: z.array(dateSchema).min(1, "Selecione ao menos uma data para a Limpeza Semanal."),
  })
  .refine((data) => new Set(data.dates.map(weekKeyOfIso)).size === data.dates.length, {
    message: "Selecione apenas um dia por semana.",
    path: ["dates"],
  });

export const cleaningGeneralDateSchema = z.object({
  date: dateSchema,
  time: timeSchema,
});

export const cleaningGeneralInputSchema = z
  .object({
    dates: z
      .array(cleaningGeneralDateSchema)
      .min(1, "Selecione ao menos uma data para a Limpeza Geral."),
    acknowledgedConflict: z.boolean().optional(),
  })
  .refine(
    (data) =>
      new Set(data.dates.map((entry) => monthKeyOfIso(entry.date))).size === data.dates.length,
    { message: "Selecione apenas uma data por mês.", path: ["dates"] },
  );

export const cleaningGeneralUpdateSchema = z.object({
  date: dateSchema,
  time: timeSchema,
  acknowledgedConflict: z.boolean().optional(),
});

export type CleaningSectorInput = z.infer<typeof cleaningSectorSchema>;
export type CleaningListSectorInput = z.infer<typeof cleaningListSectorSchema>;
export type CleaningWeeklyInput = z.infer<typeof cleaningWeeklySchema>;
export type CleaningGeneralDateInput = z.infer<typeof cleaningGeneralDateSchema>;
export type CleaningGeneralInput = z.infer<typeof cleaningGeneralInputSchema>;
export type CleaningGeneralUpdateInput = z.infer<typeof cleaningGeneralUpdateSchema>;
