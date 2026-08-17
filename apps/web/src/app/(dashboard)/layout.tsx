import { headers } from "next/headers";
import { Header } from "@/components/shared/header";
import { getActorFromHeaders } from "@/features/organizations/server/access";
import { getCurrentContext } from "@/features/organizations/server/context";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const actor = await getActorFromHeaders(await headers());

  let org: { name: string; role?: string; isSubUser?: boolean } | null = null;

  if (actor) {
    if (actor.isSubUser) {
      org = { name: "Sub-user", isSubUser: true };
    } else {
      const context = await getCurrentContext(actor);
      if (context.kind === "member") {
        org = { name: context.membership.organization.name, role: context.membership.role };
      }
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        user={actor ? { name: actor.name, email: actor.email, image: null } : null}
        org={org}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
