"use client";

import { LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getFullNav, getPrimaryNav, type NavItem } from "@/components/dashboard-nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MemberRole } from "@/generated/prisma/enums";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  return pathname === href;
}

function TabLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {item.label}
    </Link>
  );
}

export function DashboardHeader({ role, displayName }: { role: MemberRole; displayName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  const primaryItems = getPrimaryNav(role);
  const fullItems = getFullNav(role);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4 sm:px-6">
        <Link href="/dashboard" className="shrink-0 text-base font-semibold tracking-tight">
          Asignaciones
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center gap-1 md:flex"
          aria-label="Navegação principal"
        >
          {primaryItems.map((item) => (
            <TabLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <span className="text-muted-foreground truncate text-sm" title={displayName}>
            {displayName}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={handleSignOut}>
            Sair
          </Button>
        </div>

        <div className="ml-auto md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="truncate text-sm font-medium">{displayName}</span>
                <span className="text-muted-foreground text-xs">
                  {role === "OWNER" ? "Owner" : role === "ADMIN" ? "Admin" : "Member"}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {fullItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className={cn(active && "bg-accent")}>
                      <item.icon aria-hidden="true" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
                <LogOut aria-hidden="true" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
