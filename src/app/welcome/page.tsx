import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateOrganizationForm, JoinOrganizationForm } from "@/components/welcome-forms";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSubUser } from "@/lib/roles";

export default async function WelcomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const user = session.user as { id: string; email: string | null; name: string | null };

  const membership = await prisma.organizationMember.findUnique({
    where: { userId: user.id },
  });

  if (membership) {
    redirect("/dashboard");
  }

  if (isSubUser(user.email)) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 items-start justify-center px-6 py-10">
      <div className="w-full max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Boas-vindas, {user.name?.split(" ")[0] ?? "irmão"}!</CardTitle>
            <CardDescription>
              O Asignaciones ajuda a organizar as designações da sua congregação: membros, famílias,
              privilégios e escala das reuniões — tudo em um só lugar, direto no celular.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Sem organização ainda</Badge>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Você recebeu um token para <strong className="text-foreground">criar</strong> ou{" "}
              <strong className="text-foreground">entrar</strong> em uma organização?
            </p>
            <SignOutButton />
          </CardContent>
        </Card>

        <CreateOrganizationForm />
        <JoinOrganizationForm />
      </div>
    </main>
  );
}
