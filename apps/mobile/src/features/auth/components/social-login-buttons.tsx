import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { FontSize, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { authClient } from "@/lib/auth-client";

type Provider = "google" | "apple";

export function SocialLoginButtons() {
  const colors = useTheme();
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSocialLogin(provider: Provider) {
    setLoading(provider);
    setError(null);

    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
      });

      if (result.error) {
        setError("Não foi possível entrar. Tente novamente.");
        return;
      }

      router.replace("/dashboard");
    } catch {
      setError("Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

      <Button
        title="Continuar com Google"
        variant="outline"
        loading={loading === "google"}
        disabled={loading !== null}
        onPress={() => handleSocialLogin("google")}
      />
      <Button
        title="Continuar com Apple"
        variant="outline"
        loading={loading === "apple"}
        disabled={loading !== null}
        onPress={() => handleSocialLogin("apple")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: Spacing.md,
  },
  error: {
    fontSize: FontSize.sm,
    textAlign: "center",
  },
});
