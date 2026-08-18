import { CalendarClock, CheckCircle2, ClipboardList, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    icon: ClipboardList,
    title: "Atribua tarefas",
    description: "Distribua responsabilidades para sua equipe de forma rápida e organizada.",
  },
  {
    icon: CalendarClock,
    title: "Agende reuniões",
    description: "Crie reuniões e designe quem participa — tudo no mesmo lugar das tarefas.",
  },
  {
    icon: CheckCircle2,
    title: "Acompanhe o progresso",
    description: "Veja o status de cada designação em tempo real, do início à conclusão.",
  },
];

const steps = [
  {
    title: "Crie ou entre em uma organização",
    description:
      "Use um token fornecido pelo sub-user para criar uma organização, ou entre com o convite do owner.",
  },
  {
    title: "Designem tarefas e reuniões",
    description:
      "Cada pessoa sabe o que precisa fazer, em quais reuniões deve estar e por quem foi designada.",
  },
  {
    title: "Acompanhe até concluir",
    description:
      "O status de cada designação fica visível para toda a equipe, em qualquer dispositivo.",
  },
];

export default function MarketingPage() {
  return (
    <>
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h1 className="font-heading max-w-2xl text-center text-3xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Organize as designações da sua equipe em um só lugar
        </h1>
        <p className="max-w-xl text-center text-muted-foreground text-base sm:text-lg">
          Asignaciones ajuda você a criar, distribuir e acompanhar tarefas e reuniões da sua equipe
          de forma simples e eficiente.
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
        <div className="mb-8 flex flex-col gap-2 sm:items-center sm:text-center">
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Tudo para sua equipe em um só lugar
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Tarefas e reuniões unificadas, com designações claras de quem, para quê e quando.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="w-full"
            >
              <CardHeader className="gap-3">
                <feature.icon className="size-5 text-foreground" />
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Em breve disponível para sua equipe.
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 sm:items-center sm:text-center">
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Como funciona
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Do primeiro token à conclusão, em três passos.
          </p>
        </div>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <div className="flex h-full flex-col gap-3 rounded-xl border bg-card p-6 ring-1 ring-foreground/10">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-base font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Separator />

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center ring-1 ring-foreground/10 sm:p-12">
          <Users className="size-8 text-foreground" />
          <h2 className="font-heading max-w-xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Pronto para colocar sua equipe em ordem?
          </h2>
          <p className="max-w-md text-sm text-muted-foreground sm:text-base">
            Entre com sua conta e comece a designar tarefas e reuniões hoje mesmo.
          </p>
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto"
          >
            <Link href="/login">Começar agora</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
