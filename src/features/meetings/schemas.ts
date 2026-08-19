import { z } from "zod";
import { MeetingType } from "@/generated/prisma/enums";

const workbookPartSchema = z
  .object({
    number: z.number().int().min(1).optional(),
    title: z.string().trim().min(1, "Informe o título da parte."),
    duration: z.string().optional(),
    content: z.union([z.string(), z.array(z.string())]).optional(),
    questions: z.array(z.string()).optional(),
    assignment: z.string().optional(),
    territory: z.string().optional(),
    format: z.string().optional(),
  })
  .passthrough();

const workbookWeekSchema = z.object({
  week: z.string().trim().min(1, "Informe a semana."),
  BibleReading: z.string().default(""),
  meeting: z
    .object({
      openingSong: z.string().optional(),
      openingPrayer: z.boolean().optional(),
      openingComments: z.string().optional(),
      "TREASURES FROM GODS WORD": z.array(workbookPartSchema).optional(),
      "APPLY YOURSELF TO THE FIELD MINISTRY": z.array(workbookPartSchema).optional(),
      "LIVING AS CHRISTIANS": z.array(workbookPartSchema).optional(),
      concludingComments: z.string().optional(),
      closingSong: z.string().optional(),
      closingPrayer: z.boolean().optional(),
    })
    .passthrough(),
});

export const workbookContentSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da apostila."),
  weeks: z.array(workbookWeekSchema),
  coverInformation: z
    .object({
      coverImage: z.string().optional(),
      volume: z.string().optional(),
      symbol: z.string().min(1),
    })
    .optional(),
  additionalInformation: z
    .object({
      week: z.string(),
      title: z.string(),
      duration: z.string(),
      content: z.string().optional(),
      video: z.string().optional(),
    })
    .optional(),
});

export const meetingSaveSchema = z.object({
  meetingType: z.nativeEnum(MeetingType).default(MeetingType.MIDWEEK),
  symbol: z.string().trim().min(1, "Informe o símbolo da apostila."),
  name: z.string().trim().min(1, "Informe o nome da apostila."),
  shortTitle: z.string().optional(),
  displayTitle: z.string().optional(),
  referenceTitle: z.string().optional(),
  languageCode: z.string().optional(),
  coverImageUrl: z.string().optional(),
  content: workbookContentSchema,
});

export const meetingUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome da apostila.").optional(),
    coverImageUrl: z.string().nullable().optional(),
    content: workbookContentSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum dado para atualizar.",
  });

export const watchtowerArticleSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do artigo."),
  dates: z.string().optional(),
  color: z.string().optional(),
  openingSong: z.number().int().positive().optional(),
  closingSong: z.number().int().positive().optional(),
});

export const watchtowerSaveSchema = z.object({
  symbol: z.string().trim().min(1, "Informe o símbolo da Sentinela."),
  name: z.string().trim().min(1, "Informe o nome da Sentinela."),
  languageCode: z.string().optional(),
  articles: z.array(watchtowerArticleSchema).default([]),
});

const catalogItemSchema = z.object({
  number: z.number().int().positive("O número deve ser positivo."),
  theme: z.string().trim().min(1, "Informe o tema.").max(300, "Tema muito longo."),
});

const uniqueNumbers = (items: { number: number }[]) =>
  new Set(items.map((item) => item.number)).size === items.length;

export const songsSaveSchema = z
  .object({
    items: z.array(catalogItemSchema).default([]),
  })
  .refine((data) => uniqueNumbers(data.items), {
    message: "Números de cántico duplicados.",
    path: ["items"],
  });

export const talksSaveSchema = z
  .object({
    items: z.array(catalogItemSchema).default([]),
  })
  .refine((data) => uniqueNumbers(data.items), {
    message: "Números de discurso duplicados.",
    path: ["items"],
  });

export type WorkbookContentInput = z.infer<typeof workbookContentSchema>;
export type MeetingSaveInput = z.infer<typeof meetingSaveSchema>;
export type MeetingUpdateInput = z.infer<typeof meetingUpdateSchema>;
export type WatchtowerSaveInput = z.infer<typeof watchtowerSaveSchema>;
export type SongsSaveInput = z.infer<typeof songsSaveSchema>;
export type TalksSaveInput = z.infer<typeof talksSaveSchema>;
