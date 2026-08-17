import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("E-mail inválido")
  .max(254, "E-mail muito longo");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "O nome deve ter pelo menos 2 caracteres")
  .max(120, "O nome deve ter no máximo 120 caracteres");

export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .max(72, "A senha deve ter no máximo 72 caracteres");

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "A senha é obrigatória"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
