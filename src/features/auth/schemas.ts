import { z } from "zod";
import { tokenCode } from "@/lib/schemas";

export const createOrganizationSchema = z.object({
  token: tokenCode,
  organizationName: z
    .string()
    .trim()
    .min(3, "O nome da organização deve ter pelo menos 3 caracteres.")
    .max(60, "Nome muito longo."),
  personName: z.string().trim().min(2, "Informe o seu nome.").max(120, "Nome muito longo."),
  personSexo: z.enum(["MALE", "FEMALE"]),
});

export const joinOrganizationSchema = z.object({
  token: tokenCode,
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type JoinOrganizationInput = z.infer<typeof joinOrganizationSchema>;
