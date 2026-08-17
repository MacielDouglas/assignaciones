import { ZodError } from "zod";

import { AUTH_MESSAGE, OrgError } from "../server/errors";

export function apiError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

export function statusForOrgError(error: OrgError): number {
  switch (error.code) {
    case "UNAUTHENTICATED":
      return 401;
    case "FORBIDDEN":
      return 403;
    default:
      return 400;
  }
}

export async function handleApi<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    return Response.json({ data: await fn() });
  } catch (error) {
    if (error instanceof OrgError) {
      return apiError(error.message, statusForOrgError(error));
    }
    if (error instanceof ZodError) {
      return apiError(error.errors[0]?.message ?? "Dados inválidos");
    }
    return apiError("Erro inesperado. Tente novamente.", 500);
  }
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  return (await request.json().catch(() => null)) ?? {};
}

export function unauthorized(): Response {
  return apiError(AUTH_MESSAGE, 401);
}
