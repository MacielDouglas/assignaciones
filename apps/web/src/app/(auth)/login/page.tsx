import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SocialLoginButtons } from "@/features/auth/components/social-login-buttons";
import { getCurrentUser } from "@/features/auth/server/session";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre na sua conta do Asignaciones",
};

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo ao Asignaciones</CardTitle>
          <CardDescription>Entre com sua conta para começar</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Suspense fallback={null}>
            <SocialLoginButtons />
          </Suspense>
          <Separator />
          <p className="text-center text-xs text-muted-foreground">
            Ao continuar, você concorda com nossos termos de uso e política de privacidade.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
