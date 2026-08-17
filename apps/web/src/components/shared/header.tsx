import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
};

export function Header({ user }: HeaderProps) {
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
