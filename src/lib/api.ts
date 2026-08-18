import { NextResponse } from "next/server";

export function jsonError(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Erro inesperado.";
}
