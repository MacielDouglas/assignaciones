import { CalendarClock, Home, type LucideIcon, Settings, UserRound, Users } from "lucide-react";
import type { MemberRole } from "@/generated/prisma/enums";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/designacoes", label: "Designações", icon: CalendarClock },
  { href: "/dashboard/perfil", label: "Perfil", icon: UserRound },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/membros", label: "Membros", icon: Users },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

export function isAdminRole(role: MemberRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function isOwnerRole(role: MemberRole): boolean {
  return role === "OWNER";
}

export function isNavActive(pathname: string, href: string, itemHrefs: string[]): boolean {
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  return !itemHrefs.some(
    (other) => other !== href && other.length > href.length && pathname.startsWith(`${other}/`),
  );
}

export function getPrimaryNav(role: MemberRole): NavItem[] {
  if (isAdminRole(role)) {
    return [...PRIMARY_NAV_ITEMS, ...ADMIN_NAV_ITEMS];
  }
  return PRIMARY_NAV_ITEMS;
}
