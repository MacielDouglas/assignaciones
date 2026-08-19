import { z } from "zod";
import { Sex } from "@/generated/prisma/enums";

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

export type PersonInput = z.infer<typeof personInputSchema>;
export type PersonUpdate = z.infer<typeof personUpdateSchema>;
