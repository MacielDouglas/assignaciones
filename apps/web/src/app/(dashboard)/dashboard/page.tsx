import type { Metadata } from "next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/features/auth/server/session";

export const metadata: Metadata = {
  title: "Painel",
  description: "Painel do Asignaciones",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarImage
              src={user?.image ?? undefined}
              alt={user?.name ?? "Usuário"}
            />
            <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-heading text-xl font-semibold sm:text-2xl">
              Olá, {user?.name?.split(" ")[0] ?? "usuário"}!
            </h1>
            <p className="text-sm text-muted-foreground">Gerencie suas atribuições aqui.</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="w-fit"
        >
          Conectado
        </Badge>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Atribuições</CardTitle>
            <CardDescription>Suas tarefas e responsabilidades</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pendentes</CardTitle>
            <CardDescription>Tarefas aguardando execução</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Concluídas</CardTitle>
            <CardDescription>Atribuições finalizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold">0</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
