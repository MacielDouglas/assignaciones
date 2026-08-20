import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileManager } from "@/features/people/components/profile-manager";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSubUser } from "@/lib/roles";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const user = session.user as {
    id: string;
    name: string | null;
    email: string | null;
    image?: string | null;
  };
  const subUser = isSubUser(user.email);

  let organizationId: string | null = null;
  let person: {
    id: string;
    nome: string;
    sexo: "MALE" | "FEMALE";
    casado: boolean;
    familia: { id: string; name: string } | null;
    spouse: { id: string; nome: string } | null;
    marriedTo: { id: string; nome: string } | null;
    familiaPersons: { id: string; nome: string }[];
  } | null = null;

  if (!subUser) {
    const membership = await prisma.organizationMember.findUnique({
      where: { userId: user.id },
    });
    if (!membership) redirect("/welcome");
    organizationId = membership.organizationId;

    if (membership.personId) {
      const linked = await prisma.person.findUnique({
        where: { id: membership.personId },
        include: {
          familia: { select: { id: true, name: true } },
          spouse: { select: { id: true, nome: true } },
          marriedTo: { select: { id: true, nome: true } },
        },
      });
      if (linked) {
        const familyMembers = linked.familiaId
          ? await prisma.person.findMany({
              where: { organizationId, familiaId: linked.familiaId },
              select: { id: true, nome: true },
              orderBy: { nome: "asc" },
            })
          : [];
        person = {
          id: linked.id,
          nome: linked.nome,
          sexo: linked.sexo,
          casado: linked.casado,
          familia: linked.familia,
          spouse: linked.spouse,
          marriedTo: linked.marriedTo,
          familiaPersons: familyMembers.filter((member) => member.id !== linked.id),
        };
      }
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-5 py-10 sm:px-6 sm:py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Perfil</h1>
        <p className="text-muted-foreground max-w-md text-base">
          Sua pessoa na congregação e os dados da sua conta.
        </p>
      </header>

      <ProfileManager
        organizationId={organizationId}
        person={person}
        userName={user.name ?? "Usuário"}
        userEmail={user.email}
        userImage={user.image ?? null}
        subUser={subUser}
      />
    </main>
  );
}
