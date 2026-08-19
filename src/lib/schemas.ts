import { z } from "zod";
import { MeetingType, MemberRole, Sex } from "@/generated/prisma/enums";

const tokenCode = z
  .string()
  .min(1, "Informe o token.")
  .transform((value) => value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())
  .refine((value) => /^[A-Z0-9]{10}$/.test(value), {
    message: "O token deve ter 10 caracteres alfanuméricos (ex.: ABC-123-DEF-4).",
  });

const personBaseSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome.").max(120, "Nome muito longo."),
  sexo: z.nativeEnum(Sex),
  chefeFamilia: z.boolean().default(false),
  familiaId: z.string().min(1, "Família obrigatória."),
  jovem: z.boolean().default(false),
  estudante: z.boolean().default(true),
  batizado: z.boolean().default(false),
  ativo: z.boolean().default(true),
  limpeza: z.boolean().default(true),
  casado: z.boolean().default(false),
  iniciandoConversa: z.boolean().default(false),
  cultivandoInteresse: z.boolean().default(false),
  fazendoDiscipulos: z.boolean().default(false),
  explicandoCrencas: z.boolean().default(false),
  discursoFacaseuMelhor: z.boolean().default(false),
  leituraBiblia: z.boolean().default(true),
  privilegiosServico: z.boolean().default(false),
  oracao: z.boolean().default(false),
  anciao: z.boolean().default(false),
  oQueVoceDiria: z.boolean().default(false),
  presidenteNossaVida: z.boolean().default(false),
  discursoTesouros: z.boolean().default(false),
  joiasEspirituais: z.boolean().default(false),
  partesNossaVidaCrista: z.boolean().default(false),
  estudoBiblicoCongregacao: z.boolean().default(false),
  leitorEstudoBiblico: z.boolean().default(false),
  presidenteReuniaoPublica: z.boolean().default(false),
  discursoPublico: z.boolean().default(false),
  dirigenteEstudoSentinela: z.boolean().default(false),
  leitorEstudoSentinela: z.boolean().default(false),
});

const notMarriedYoung = (data: { jovem?: boolean; casado?: boolean }) =>
  !(data.jovem === true && data.casado === true);

export const personInputSchema = personBaseSchema.refine(notMarriedYoung, {
  message: "Jovem não pode ser casado.",
  path: ["casado"],
});

export const personUpdateSchema = personBaseSchema
  .partial()
  .extend({
    familiaId: z.string().min(1, "Família obrigatória.").optional(),
  })
  .refine(notMarriedYoung, {
    message: "Jovem não pode ser casado.",
    path: ["casado"],
  });

export const createOrganizationSchema = z.object({
  token: tokenCode,
  organizationName: z
    .string()
    .trim()
    .min(3, "O nome da organização deve ter pelo menos 3 caracteres.")
    .max(60, "Nome muito longo."),
  personName: z.string().trim().min(2, "Informe o seu nome.").max(120, "Nome muito longo."),
  personSexo: z.nativeEnum(Sex),
});

export const joinOrganizationSchema = z.object({
  token: tokenCode,
});

export const createInviteTokenSchema = z
  .object({
    personId: z.string().optional(),
    personName: z
      .string()
      .trim()
      .min(2, "Informe o nome do convidado.")
      .max(120, "Nome muito longo.")
      .optional(),
    personSexo: z.nativeEnum(Sex).optional(),
    familyId: z.string().optional(),
    newFamilyName: z
      .string()
      .trim()
      .min(2, "Informe o nome da nova família.")
      .max(60, "Nome muito longo.")
      .optional(),
  })
  .refine((data) => Boolean(data.personId) !== Boolean(data.personName), {
    message: "Escolha uma pessoa existente ou informe os dados de uma nova pessoa.",
    path: ["personId"],
  });

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(MemberRole),
});

export type PersonInput = z.infer<typeof personInputSchema>;
export type PersonUpdate = z.infer<typeof personUpdateSchema>;

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

export type WatchtowerSaveInput = z.infer<typeof watchtowerSaveSchema>;

export const meetingUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome da apostila.").optional(),
    coverImageUrl: z.string().nullable().optional(),
    content: workbookContentSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum dado para atualizar.",
  });

export type WorkbookContentInput = z.infer<typeof workbookContentSchema>;
export type MeetingSaveInput = z.infer<typeof meetingSaveSchema>;
export type MeetingUpdateInput = z.infer<typeof meetingUpdateSchema>;
