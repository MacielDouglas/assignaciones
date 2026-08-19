import { createHash, randomBytes } from "node:crypto";

export const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateTokenCode(): string {
  const bytes = randomBytes(10);
  let code = "";
  for (const byte of bytes) {
    code += TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length];
  }
  return code;
}

export function formatTokenCode(code: string): string {
  const normalized = normalizeTokenCode(code);
  return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6, 9)}-${normalized.slice(9, 10)}`;
}

export function normalizeTokenCode(input: string): string {
  return input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function isValidTokenCode(input: string): boolean {
  return /^[A-Z0-9]{10}$/.test(normalizeTokenCode(input));
}

export function hashTokenCode(code: string): string {
  return createHash("sha256").update(normalizeTokenCode(code)).digest("hex");
}

export function isTokenExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now();
}

export function isTokenUsed(usedAt: Date | null): boolean {
  return usedAt !== null;
}
