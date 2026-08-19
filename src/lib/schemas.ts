import { z } from "zod";

export const tokenCode = z
  .string()
  .min(1, "Informe o token.")
  .transform((value) => value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())
  .refine((value) => /^[A-Z0-9]{10}$/.test(value), {
    message: "O token deve ter 10 caracteres alfanuméricos (ex.: ABC-123-DEF-4).",
  });

export type TokenCodeInput = z.infer<typeof tokenCode>;
