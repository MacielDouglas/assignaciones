import { ArrowLeft, UserCheck } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";

export default async function DesignacoesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-5 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard" aria-label="Voltar ao painel">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-medium">Designações</h1>
          <p className="text-muted-foreground text-sm">
            Atribuição de pessoas para as partes das reuniões
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
            <UserCheck className="size-6" aria-hidden="true" />
          </div>
          <p className="font-medium">Em breve</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            A designação automática das pessoas para as partes da programação das reuniões chegará
            aqui.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
