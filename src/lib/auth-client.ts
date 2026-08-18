import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_URL,
  plugins: [
    inferAdditionalFields<typeof auth>(), // infere os campos reais do servidor
  ],
});

export const signIn = async (callbackURL = "/") => {
  // ✅ aceita parâmetro
  const { data, error } = await authClient.signIn.social({
    provider: "google",
    callbackURL,
  });

  if (error) throw new Error(error.message ?? "Error al iniciar sesión.");
  return data;
};
