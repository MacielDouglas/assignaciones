"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type Provider = "google" | "apple";

const providerLabels: Record<Provider, string> = {
  google: "Continuar com Google",
  apple: "Continuar com Apple",
};

export function SocialLoginButtons() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callbackURL = searchParams.get("callbackUrl") ?? "/dashboard";

  async function handleSocialLogin(provider: Provider) {
    setIsLoading(provider);
    setError(null);

    try {
      await authClient.signIn.social({
        provider,
        callbackURL,
        errorCallbackURL: "/login",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao entrar. Tente novamente.");
    } finally {
      setIsLoading(null);
      router.refresh();
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isLoading !== null}
        onClick={() => handleSocialLogin("google")}
      >
        {isLoading === "google" ? (
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        {providerLabels.google}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isLoading !== null}
        onClick={() => handleSocialLogin("apple")}
      >
        {isLoading === "apple" ? (
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
        )}
        {providerLabels.apple}
      </Button>
    </div>
  );
}
