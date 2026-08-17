import { redirect } from "next/navigation";
import { Footer } from "@/components/shared/footer";
import { Header } from "@/components/shared/header";
import { getCurrentUser } from "@/features/auth/server/session";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
