import { z } from "zod";
import { SpecialEventKind, WeekDay } from "@/generated/prisma/enums";

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
