import { CalendarDays } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleSignInButton } from "@/features/auth/components/social-login-buttons";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <Card className="w-full max-w-sm border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader className="items-center gap-4 text-center">
          <div className="anim-stamp-in bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
            <CalendarDays className="size-7" aria-hidden="true" />
          </div>
          <div className="anim-rise-in space-y-2 [animation-delay:110ms]">
            <CardTitle className="text-2xl">Asignaciones</CardTitle>
            <CardDescription>
              Organize as designações da sua congregação de forma simples e colaborativa.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleSignInButton className="anim-rise-in [animation-delay:220ms]" />
          <p className="anim-rise-in text-muted-foreground text-center text-xs leading-relaxed [animation-delay:300ms]">
            Ao continuar, você concorda com os nossos termos de uso e política de privacidade.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
