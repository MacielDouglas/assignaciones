import {
  BookOpen,
  CalendarClock,
  Home,
  KeyRound,
  type LucideIcon,
  Settings,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import type { MemberRole } from "@/generated/prisma/enums";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/reunioes", label: "Reuniões", icon: CalendarClock },
  { href: "/dashboard/designacoes", label: "Designações", icon: UserCheck },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/reunioes/conteudo", label: "Conteúdo", icon: BookOpen },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

const FULL_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/pessoas", label: "Pessoas", icon: Users },
  { href: "/dashboard/membros", label: "Membros", icon: UserRound },
  { href: "/dashboard/tokens", label: "Tokens", icon: KeyRound },
];

export function isAdminRole(role: MemberRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function isOwnerRole(role: MemberRole): boolean {
  return role === "OWNER";
}

export function getPrimaryNav(role: MemberRole): NavItem[] {
  if (isAdminRole(role)) {
    return [...PRIMARY_NAV_ITEMS, ...ADMIN_NAV_ITEMS];
  }
  return PRIMARY_NAV_ITEMS;
}

export function getFullNav(role: MemberRole): NavItem[] {
  return [
    ...PRIMARY_NAV_ITEMS,
    ...ADMIN_NAV_ITEMS,
    ...FULL_NAV_ITEMS.filter(
      (item) =>
        !(item.href === "/dashboard/membros" && !isAdminRole(role)) &&
        !(item.href === "/dashboard/tokens" && !isOwnerRole(role)),
    ),
  ];
}
