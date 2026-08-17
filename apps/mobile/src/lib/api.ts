import { authClient } from "@/lib/auth-client";

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

type ApiResponse<T> = { data: T } | { error: string };

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const cookie = authClient.getCookie();

  const res = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      ...(cookie ? { cookie } : {}),
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok) {
    const message = body && "error" in body ? body.error : "Erro inesperado. Tente novamente.";
    throw new Error(message);
  }

  if (!body || "error" in body) {
    throw new Error("Resposta inválida do servidor");
  }

  return body.data;
}

export function apiUrlFor(path: string): string {
  return `${apiUrl}${path}`;
}
