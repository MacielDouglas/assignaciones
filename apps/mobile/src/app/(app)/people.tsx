import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextInput } from "@/components/ui/text-input";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { createPerson, listPeople, type Person } from "@/lib/organizations";

function CreatePersonCard({ organizationId }: { organizationId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await createPerson({
        organizationId,
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setName("");
      setEmail("");
      setPhone("");
      setCreated(true);
      setTimeout(() => setCreated(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar pessoa");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <ThemedText variant="heading">Nova pessoa</ThemedText>
      <ThemedText variant="muted">Crie uma pessoa para depois vincular a um usuário.</ThemedText>
      <TextInput
        placeholder="Nome"
        value={name}
        onChangeText={setName}
        maxLength={120}
      />
      <TextInput
        placeholder="E-mail (opcional)"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        maxLength={254}
      />
      <TextInput
        placeholder="Telefone (opcional)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={20}
      />
      {error ? <ThemedText variant="error">{error}</ThemedText> : null}
      {created ? <ThemedText variant="muted">Pessoa criada!</ThemedText> : null}
      <Button
        title={loading ? "Criando..." : "Criar pessoa"}
        onPress={handleSubmit}
        disabled={loading || name.trim().length < 2}
      />
    </Card>
  );
}

export default function PeopleScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const params = useLocalSearchParams<{ org?: string }>();
  const orgId = params.org;

  const [people, setPeople] = useState<Person[] | null>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listPeople(orgId);
      setPeople(data.people);
      if (data.organizationId) {
        setCurrentOrgId(data.organizationId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pessoas");
    }
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top + Spacing.lg }]}>
      {!people ? (
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ThemedText variant="error">{error}</ThemedText>
          <Button
            title="Tentar novamente"
            onPress={load}
          />
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText variant="title">Pessoas</ThemedText>
              <ThemedText variant="muted">
                Pessoas da organização. Uma pessoa pode ter ou não um usuário vinculado.
              </ThemedText>
              <CreatePersonCard organizationId={currentOrgId ?? orgId ?? ""} />
              <ThemedText variant="heading">Lista de pessoas</ThemedText>
            </View>
          }
          ListEmptyComponent={<ThemedText variant="muted">Nenhuma pessoa criada ainda.</ThemedText>}
          renderItem={({ item }) => (
            <Card>
              <ThemedText variant="heading">{item.name}</ThemedText>
              <ThemedText variant="muted">
                {[item.email, item.phone].filter(Boolean).join(" · ") || "Sem contato"}
              </ThemedText>
              <ThemedText variant="muted">
                {item.member
                  ? `Vinculada a ${item.member.user.name ?? "um usuário"}`
                  : "Sem usuário vinculado"}
              </ThemedText>
            </Card>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
});
