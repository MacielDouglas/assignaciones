import { memberRoleLabels } from "@asignaciones/shared";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/features/auth/server/actions";

type HeaderProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  org?: {
    name: string;
    role?: string;
    isSubUser?: boolean;
  } | null;
};

export function Header({ user, org }: HeaderProps) {
  const canManage = org?.role === "OWNER" || org?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-heading text-lg font-semibold tracking-tight"
        >
          Asignaciones
        </Link>

        <nav className="flex items-center gap-2">
          {org ? (
            <>
              <span className="hidden sm:block">
                {org.isSubUser ? (
                  <Badge
                    variant="secondary"
                    className="text-xs"
                  >
                    Sub-user
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="text-xs"
                  >
                    {org.name} ·{" "}
                    {org.role ? memberRoleLabels[org.role as "OWNER" | "ADMIN" | "MEMBER"] : ""}
                  </Badge>
                )}
              </span>
              {canManage ? (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                  >
                    <Link href="/members">Membros</Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                  >
                    <Link href="/people">Pessoas</Link>
                  </Button>
                </>
              ) : null}
            </>
          ) : null}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Abrir menu do usuário"
                >
                  <Avatar className="size-8">
                    <AvatarImage
                      src={user.image ?? undefined}
                      alt={user.name ?? "Usuário"}
                    />
                    <AvatarFallback>{user.name?.slice(0, 2).toUpperCase() ?? "U"}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56"
              >
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Painel</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={signOutAction}>
                  <DropdownMenuItem asChild>
                    <button
                      type="submit"
                      className="w-full cursor-pointer text-destructive focus:text-destructive"
                    >
                      Sair
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              size="sm"
            >
              <Link href="/login">Entrar</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
