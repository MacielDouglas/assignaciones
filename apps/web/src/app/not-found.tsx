import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-heading text-6xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="max-w-md text-muted-foreground">
        A página que você procura não existe ou foi movida.
      </p>
      <Button asChild>
        <Link href="/">Voltar ao início</Link>
      </Button>
    </main>
  );
}
