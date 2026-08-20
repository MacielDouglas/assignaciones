import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { BottomBar } from "@/components/bottom-bar";
import { DashboardHeader } from "@/components/dashboard-header";
import type { MemberRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSubUser } from "@/lib/roles";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const user = session.user as { id: string; email: string | null; name: string | null };
  const subUser = isSubUser(user.email);

  let role: MemberRole = "MEMBER";
  let displayName = user.name ?? "Usuário";

  if (subUser) {
    role = "OWNER";
  } else {
    const membership = await prisma.organizationMember.findUnique({
      where: { userId: user.id },
      include: { person: { select: { nome: true } } },
    });
    if (!membership) {
      redirect("/welcome");
    }
    role = membership.role;
    displayName = membership.person?.nome ?? user.name ?? "Usuário";
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <DashboardHeader role={role} displayName={displayName} />
      <div className="flex flex-1 flex-col pb-[max(6rem,calc(4rem+env(safe-area-inset-bottom)))] md:pb-0">
        {children}
      </div>
      <BottomBar role={role} />
    </div>
  );
}
