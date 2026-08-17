import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    title: "Atribua tarefas",
    description: "Distribua responsabilidades para sua equipe de forma rápida e organizada.",
  },
  {
    title: "Acompanhe o progresso",
    description: "Veja o status de cada atribuição em tempo real, do início à conclusão.",
  },
  {
    title: "Equipe conectada",
    description: "Todos sabem o que precisa ser feito e por quem, em qualquer dispositivo.",
  },
];

export default function MarketingPage() {
  return (
    <>
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <Badge
          variant="outline"
          className="text-xs sm:text-sm"
        >
          Gestão de atribuições para equipes
        </Badge>
        <h1 className="font-heading max-w-2xl text-center text-3xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Organize as atribuições da sua equipe em um só lugar
        </h1>
        <p className="max-w-xl text-center text-muted-foreground text-base sm:text-lg">
          Asignaciones ajuda você a criar, distribuir e acompanhar tarefas da sua equipe de forma
          simples e eficiente.
        </p>
        <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto"
          >
            <Link href="/login">Começar agora</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Link href="/dashboard">Ver painel</Link>
          </Button>
        </div>
      </section>

      <Separator />

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="w-full"
            >
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Em breve disponível para sua equipe.
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
