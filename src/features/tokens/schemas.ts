import { z } from "zod";

export const createInviteTokenSchema = z
  .object({
    personId: z.string().optional(),
    personName: z
      .string()
      .trim()
      .min(2, "Informe o nome do convidado.")
      .max(120, "Nome muito longo.")
      .optional(),
    personSexo: z.enum(["MALE", "FEMALE"]).optional(),
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

export type CreateInviteTokenInput = z.infer<typeof createInviteTokenSchema>;
