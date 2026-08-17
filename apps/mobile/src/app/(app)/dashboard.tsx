import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Spacing } from "@/constants/theme";
import { authClient } from "@/lib/auth-client";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const user = session?.user;

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/");
  }

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top + Spacing.lg }]}>
      <View style={styles.header}>
        <ThemedText variant="title">Olá, {user?.name?.split(" ")[0] ?? "usuário"}!</ThemedText>
        <ThemedText variant="muted">Gerencie suas atribuições aqui.</ThemedText>
      </View>

      <View style={styles.content}>
        <Card>
          <ThemedText variant="heading">Atribuições</ThemedText>
          <ThemedText variant="muted">Suas tarefas e responsabilidades</ThemedText>
          <ThemedText variant="title">0</ThemedText>
        </Card>

        <Card>
          <ThemedText variant="heading">Pendentes</ThemedText>
          <ThemedText variant="muted">Tarefas aguardando execução</ThemedText>
          <ThemedText variant="title">0</ThemedText>
        </Card>

        <Card>
          <ThemedText variant="heading">Concluídas</ThemedText>
          <ThemedText variant="muted">Atribuições finalizadas</ThemedText>
          <ThemedText variant="title">0</ThemedText>
        </Card>
      </View>

      <Button
        title="Sair"
        variant="outline"
        onPress={handleSignOut}
        style={styles.signOut}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  content: {
    gap: Spacing.lg,
  },
  signOut: {
    marginTop: Spacing.xl,
  },
});
