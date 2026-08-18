import type { MemberRole } from "@/generated/prisma/enums";

export function getSubUserEmails(): string[] {
  const raw = process.env.SUB_USER_EMAILS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isSubUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return getSubUserEmails().includes(email.toLowerCase());
}

export const ROLE_ORDER: Record<MemberRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

export function canManagePeople(role: MemberRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function canManageTokens(role: MemberRole): boolean {
  return role === "OWNER";
}

export function canManageMembers(role: MemberRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function canPromoteTo(actor: MemberRole, target: MemberRole): boolean {
  if (actor === "OWNER") return true;
  if (actor === "ADMIN") return target !== "OWNER";
  return false;
}
