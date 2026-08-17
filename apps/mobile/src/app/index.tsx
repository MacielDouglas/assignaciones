import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Spacing } from "@/constants/theme";
import { SocialLoginButtons } from "@/features/auth/components/social-login-buttons";
import { authClient } from "@/lib/auth-client";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && session) {
      router.replace("/dashboard");
    }
  }, [isPending, session]);

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top + Spacing.xl }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText variant="title">Asignaciones</ThemedText>
          <ThemedText
            variant="muted"
            style={styles.subtitle}
          >
            Entre com sua conta para começar
          </ThemedText>
        </View>

        <Card>
          <SocialLoginButtons />
        </Card>

        <ThemedText
          variant="small"
          style={styles.legal}
        >
          Ao continuar, você concorda com nossos termos de uso e política de privacidade.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xl,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
  },
  legal: {
    textAlign: "center",
    opacity: 0.8,
  },
});
