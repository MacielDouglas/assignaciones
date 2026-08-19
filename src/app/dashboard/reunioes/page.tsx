import { ArrowLeft, BookOpen, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function MeetingsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-6 sm:py-16">
      <div className="space-y-8">
        <header className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/dashboard" aria-label="Voltar ao painel">
              <ArrowLeft />
              Painel
            </Link>
          </Button>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Reuniões
            </h1>
            <p className="text-muted-foreground max-w-md text-base">
              Monte e acompanhe a escala da congregação.
            </p>
          </div>
        </header>

        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
              <CalendarDays className="size-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Em breve</h2>
              <p className="text-muted-foreground mx-auto max-w-xs text-sm">
                A montagem da escala ainda está sendo construída. Enquanto isso, você já pode
                importar e editar as apostilas.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/reunioes/conteudo">
                <BookOpen />
                Conteúdo das reuniões
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
