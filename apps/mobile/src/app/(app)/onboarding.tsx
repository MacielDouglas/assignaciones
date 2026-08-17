import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextInput } from "@/components/ui/text-input";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Spacing } from "@/constants/theme";
import { redeemToken } from "@/lib/organizations";

function CreateOrgForm() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await redeemToken(code.trim().toUpperCase(), name.trim());
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar organização");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <ThemedText variant="heading">Criar uma organização</ThemedText>
      <ThemedText variant="muted">
        Use o token fornecido pelo sub-user para criar uma nova organização.
      </ThemedText>
      <TextInput
        placeholder="Token (8 caracteres)"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={8}
      />
      <TextInput
        placeholder="Nome da organização"
        value={name}
        onChangeText={setName}
        maxLength={80}
      />
      {error ? <ThemedText variant="error">{error}</ThemedText> : null}
      <Button
        title={loading ? "Criando..." : "Criar organização"}
        onPress={handleSubmit}
        disabled={loading || code.length !== 8 || name.trim().length < 2}
      />
    </Card>
  );
}

function JoinOrgForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await redeemToken(code.trim().toUpperCase());
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar na organização");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <ThemedText variant="heading">Entrar em uma organização</ThemedText>
      <ThemedText variant="muted">
        Use o token de convite enviado pelo owner da organização.
      </ThemedText>
      <TextInput
        placeholder="Token (8 caracteres)"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={8}
      />
      {error ? <ThemedText variant="error">{error}</ThemedText> : null}
      <Button
        title={loading ? "Entrando..." : "Entrar na organização"}
        onPress={handleSubmit}
        disabled={loading || code.length !== 8}
      />
    </Card>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top + Spacing.lg }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText variant="title">Bem-vindo ao Asignaciones!</ThemedText>
          <ThemedText variant="muted">
            Você ainda não faz parte de nenhuma organização. Crie a sua ou entre com um convite.
          </ThemedText>
        </View>

        <CreateOrgForm />
        <JoinOrgForm />

        <Button
          title="Voltar"
          variant="ghost"
          onPress={() => router.back()}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  content: {
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
});
